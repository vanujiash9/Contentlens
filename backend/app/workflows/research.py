from dataclasses import dataclass
from urllib.parse import urlparse
from uuid import UUID

from app.ai.provider import (
    AIProviderError,
    AIProviderInvalidResponseError,
    StructuredOutputProvider,
)
from app.integrations.search_provider import (
    SearchProvider,
    SearchProviderError,
    SearchProviderNotConfiguredError,
)
from app.integrations.source_fetcher import FetchedSource, SourceFetcher, SourceFetchError
from app.prompts import research_analysis
from app.repositories.research import ResearchRepository
from app.schemas.research import ResearchAnalysisGeneration, ResearchPlan
from app.workflows.core import WorkflowContext, WorkflowError, WorkflowRunner

DEFAULT_INDUSTRY = "Piano & nhạc cụ phím"
DEFAULT_MARKET = "Việt Nam"
SOURCE_FETCH_LIMIT = 5
SEARCH_RESULT_LIMIT = 10
SOURCE_ANALYSIS_TEXT_LIMIT = 12000
MIN_COMPETITOR_WARNING_THRESHOLD = 5


@dataclass(frozen=True)
class ResearchWorkflowInput:
    topic_id: UUID
    topic_title: str
    industry: str = DEFAULT_INDUSTRY
    market: str = DEFAULT_MARKET


@dataclass(frozen=True)
class ResearchWorkflowResult:
    plan: ResearchPlan
    queries_count: int
    sources_count: int
    fetched_sources_count: int
    failed_sources_count: int


class RunResearchStep:
    name = "research_topic"

    def __init__(
        self,
        research_repository: ResearchRepository,
        search_provider: SearchProvider,
        source_fetcher: SourceFetcher,
        analysis_provider: StructuredOutputProvider | None = None,
        source_fetch_limit: int = SOURCE_FETCH_LIMIT,
    ) -> None:
        self.research_repository = research_repository
        self.search_provider = search_provider
        self.source_fetcher = source_fetcher
        self.analysis_provider = analysis_provider
        self.source_fetch_limit = max(1, min(source_fetch_limit, SEARCH_RESULT_LIMIT))

    def execute(self, context: WorkflowContext) -> ResearchWorkflowResult:
        request = ResearchWorkflowInput(**context.input)
        plan = build_research_plan(request)
        self.research_repository.upsert_plan(
            workspace_id=context.workspace_id,
            topic_id=request.topic_id,
            plan=plan.model_dump(),
        )

        queries = build_search_queries(request.topic_title)
        sources: list[dict] = []
        for query in queries:
            results = self.search_provider.search(query, SEARCH_RESULT_LIMIT)
            query_row = self.research_repository.create_query(
                workspace_id=context.workspace_id,
                topic_id=request.topic_id,
                query=query,
                result_count=len(results),
            )
            sources.extend(
                self.research_repository.insert_serp_results(
                    workspace_id=context.workspace_id,
                    topic_id=request.topic_id,
                    query_id=UUID(str(query_row["id"])),
                    results=results,
                )
            )

        fetched_count = 0
        failed_count = 0
        fetched_source_ids: list[UUID] = []
        analysis_sources: list[dict] = []
        seen_urls: set[str] = set()
        for source in sources:
            if fetched_count >= self.source_fetch_limit:
                break
            canonical_url = canonicalize_url(str(source.get("url") or ""))
            if not canonical_url or canonical_url in seen_urls:
                continue
            seen_urls.add(canonical_url)
            source_id = UUID(str(source["id"]))
            try:
                fetched_source = self.source_fetcher.fetch(str(source["url"]))
            except SourceFetchError as error:
                failed_count += 1
                self.research_repository.mark_source_failed(
                    source_id=source_id,
                    error_message=error.message,
                )
                continue

            fetched_count += 1
            fetched_source_ids.append(source_id)
            fetched_row = self.research_repository.mark_source_fetched(
                source_id=source_id,
                fetched_source=fetched_source,
            )
            analysis_sources.append(
                build_analysis_source(
                    source=source,
                    fetched_row=fetched_row,
                    fetched_source=fetched_source,
                )
            )

        analysis = self._analyze_sources(request, analysis_sources)
        if analysis is None:
            self.research_repository.insert_findings(
                workspace_id=context.workspace_id,
                topic_id=request.topic_id,
                findings=build_findings(request, fetched_source_ids),
            )
            self.research_repository.insert_information_gaps(
                workspace_id=context.workspace_id,
                topic_id=request.topic_id,
                gaps=build_information_gaps(request),
            )
            self.research_repository.upsert_opportunity(
                workspace_id=context.workspace_id,
                topic_id=request.topic_id,
                opportunity=build_opportunity(
                    request,
                    fetched_count,
                    self.source_fetch_limit,
                ),
            )
        else:
            source_id_by_url = {
                str(source.get("url")): UUID(str(source["id"])) for source in analysis_sources
            }
            self.research_repository.insert_findings(
                workspace_id=context.workspace_id,
                topic_id=request.topic_id,
                findings=build_ai_findings(analysis, source_id_by_url),
            )
            self.research_repository.insert_information_gaps(
                workspace_id=context.workspace_id,
                topic_id=request.topic_id,
                gaps=build_ai_information_gaps(analysis),
            )
            self.research_repository.upsert_opportunity(
                workspace_id=context.workspace_id,
                topic_id=request.topic_id,
                opportunity=build_ai_opportunity(analysis, fetched_count, self.source_fetch_limit),
            )

        return ResearchWorkflowResult(
            plan=plan,
            queries_count=len(queries),
            sources_count=len(sources),
            fetched_sources_count=fetched_count,
            failed_sources_count=failed_count,
        )

    def _analyze_sources(
        self,
        request: ResearchWorkflowInput,
        sources: list[dict],
    ) -> ResearchAnalysisGeneration | None:
        if self.analysis_provider is None or not sources:
            return None

        source_text = format_sources_for_analysis(sources)
        if not source_text:
            return None

        try:
            result = self.analysis_provider.generate_structured(
                system_prompt=research_analysis.SYSTEM_PROMPT,
                user_prompt=research_analysis.build_user_prompt(
                    research_analysis.ResearchAnalysisPromptInput(
                        topic=request.topic_title,
                        industry=request.industry,
                        market=request.market,
                        sources=source_text,
                    ),
                    ResearchAnalysisGeneration,
                ),
                output_model=ResearchAnalysisGeneration,
            )
        except (AIProviderError, AIProviderInvalidResponseError):
            return None

        return result.output


class ResearchWorkflow:
    def __init__(
        self,
        research_repository: ResearchRepository,
        search_provider: SearchProvider,
        source_fetcher: SourceFetcher,
        analysis_provider: StructuredOutputProvider | None = None,
        source_fetch_limit: int = SOURCE_FETCH_LIMIT,
    ) -> None:
        self.runner = WorkflowRunner(
            [
                RunResearchStep(
                    research_repository,
                    search_provider,
                    source_fetcher,
                    analysis_provider,
                    source_fetch_limit,
                )
            ]
        )

    def run(
        self,
        *,
        run_id: UUID,
        workspace_id: UUID,
        request: ResearchWorkflowInput,
    ) -> ResearchWorkflowResult:
        context = WorkflowContext(
            run_id=run_id,
            workspace_id=workspace_id,
            input={
                "topic_id": request.topic_id,
                "topic_title": request.topic_title,
                "industry": request.industry,
                "market": request.market,
            },
        )
        try:
            result = self.runner.run(context)
        except WorkflowError as error:
            raise error
        except (SearchProviderNotConfiguredError, SearchProviderError) as error:
            raise WorkflowError("research_topic", error) from error

        output = result.step_outputs["research_topic"]
        if not isinstance(output, ResearchWorkflowResult):
            raise WorkflowError(
                "research_topic",
                TypeError("Research step returned an invalid result"),
            )
        return output


def build_research_plan(request: ResearchWorkflowInput) -> ResearchPlan:
    return ResearchPlan(
        objective=f"Phân tích các nội dung cạnh tranh hàng đầu cho chủ đề {request.topic_title}.",
        target_keyword=request.topic_title,
        search_intent="Người đọc đang tìm hiểu, so sánh và ra quyết định mua hoặc học piano.",
        audience=f"Người quan tâm {request.industry} tại {request.market}.",
        notes=[
            "Ưu tiên nguồn có nội dung tư vấn thực tế.",
            "Tìm điểm chung, thiếu sót và cơ hội tạo nội dung tốt hơn đối thủ.",
        ],
    )


def build_search_queries(topic_title: str) -> list[str]:
    return [topic_title, f"{topic_title} review kinh nghiệm mua"]


def build_analysis_source(
    *,
    source: dict,
    fetched_row: dict,
    fetched_source: FetchedSource,
) -> dict:
    return {
        **source,
        **fetched_row,
        "url": fetched_source.url,
        "title": fetched_source.title or source.get("title") or "Untitled",
        "domain": fetched_source.domain,
        "extracted_text": fetched_source.text,
        "headings": [heading.__dict__ for heading in fetched_source.headings],
        "word_count": fetched_source.word_count,
        "questions": list(fetched_source.questions),
        "examples": list(fetched_source.examples),
        "tables_count": fetched_source.tables_count,
        "images_count": fetched_source.images_count,
        "videos_count": fetched_source.videos_count,
    }


def format_sources_for_analysis(sources: list[dict]) -> str:
    parts = []
    for index, source in enumerate(sources, start=1):
        title = source.get("title") or "Untitled"
        url = source.get("url") or ""
        snippet = source.get("snippet") or ""
        rank = source.get("rank") or index
        text = str(source.get("extracted_text") or "")[:SOURCE_ANALYSIS_TEXT_LIMIT]
        headings = format_headings(list(source.get("headings") or []))
        questions = format_list(list(source.get("questions") or []))
        examples = format_list(list(source.get("examples") or []))
        parts.append(
            "\n".join(
                [
                    f"Competitor #{index}",
                    f"Rank: {rank}",
                    f"Title: {title}",
                    f"URL: {url}",
                    f"Snippet: {snippet}",
                    f"Word count: {source.get('word_count') or 0}",
                    f"H1/H2/H3 headings:\n{headings}",
                    f"Questions found:\n{questions}",
                    f"Examples found:\n{examples}",
                    f"Tables: {source.get('tables_count') or 0}",
                    f"Images: {source.get('images_count') or 0}",
                    f"Videos: {source.get('videos_count') or 0}",
                    f"Cleaned article text:\n{text}",
                ]
            )
        )
    return "\n\n---\n\n".join(parts)


def format_headings(headings: list[dict]) -> str:
    lines = [
        f"- {heading.get('level', '').upper()}: {heading.get('text', '')}"
        for heading in headings
        if heading.get("text")
    ]
    return "\n".join(lines) or "- No H1/H2/H3 headings extracted."


def format_list(items: list[str]) -> str:
    lines = [f"- {item}" for item in items if item]
    return "\n".join(lines) or "- None extracted."


def build_ai_findings(
    analysis: ResearchAnalysisGeneration,
    source_id_by_url: dict[str, UUID],
) -> list[dict]:
    return [
        {
            "claim": finding.claim,
            "finding_type": finding.finding_type,
            "source_ids": [
                str(source_id_by_url[url])
                for url in finding.source_urls
                if url in source_id_by_url
            ],
            "metadata": {"generated_by": "ai_research_analysis"},
        }
        for finding in analysis.findings
    ]


def build_ai_information_gaps(analysis: ResearchAnalysisGeneration) -> list[dict]:
    ai_gaps = [
        {"description": gap.description, "recommendation": gap.recommendation}
        for gap in analysis.information_gaps
    ]
    cross_serp = analysis.cross_serp_analysis
    if cross_serp is None:
        return ai_gaps
    cross_serp_gaps = [
        {"description": gap, "recommendation": "Lấp khoảng trống này trong brief/draft."}
        for gap in [
            *cross_serp.content_gaps,
            *cross_serp.weak_explanations,
            *cross_serp.unanswered_questions,
        ]
    ]
    return [*ai_gaps, *cross_serp_gaps]


def build_ai_opportunity(
    analysis: ResearchAnalysisGeneration,
    fetched_count: int,
    source_fetch_limit: int,
) -> dict:
    warnings = list(analysis.warnings)
    if fetched_count < MIN_COMPETITOR_WARNING_THRESHOLD:
        warnings.append(
            f"Chỉ phân tích được {fetched_count}/{source_fetch_limit} competitor, "
            "cần kiểm chứng thêm."
        )
    cross_serp_analysis = (
        analysis.cross_serp_analysis.model_dump(mode="json")
        if analysis.cross_serp_analysis is not None
        else None
    )
    return {
        "score": analysis.opportunity.score,
        "priority": analysis.opportunity.priority,
        "recommendation": analysis.opportunity.recommendation,
        "metadata": {
            "angle": analysis.opportunity.angle,
            "audience": analysis.opportunity.audience,
            "reasons": analysis.opportunity.reasons,
            "warnings": warnings,
            "competitor_analysis": [
                competitor.model_dump(mode="json") for competitor in analysis.competitors
            ],
            "cross_serp_analysis": cross_serp_analysis,
            "fetched_sources": fetched_count,
            "source_fetch_limit": source_fetch_limit,
            "generated_by": "ai_research_analysis",
        },
    }


def build_findings(request: ResearchWorkflowInput, source_ids: list[UUID]) -> list[dict]:
    claim = (
        f"Các nội dung cạnh tranh về {request.topic_title} thường cần giải thích rõ "
        "nhu cầu người mua và tiêu chí lựa chọn."
    )
    return [
        {
            "claim": claim,
            "finding_type": "pattern",
            "source_ids": [str(source_id) for source_id in source_ids],
            "metadata": {"generated_by": "research_workflow"},
        }
    ]


def build_information_gaps(request: ResearchWorkflowInput) -> list[dict]:
    description = (
        f"Nên bổ sung checklist ra quyết định cụ thể cho {request.topic_title} "
        "thay vì chỉ mô tả chung."
    )
    recommendation = "Thêm bảng tiêu chí, lỗi thường gặp và lời khuyên theo từng nhóm người đọc."
    return [
        {
            "description": description,
            "recommendation": recommendation,
        }
    ]


def build_opportunity(
    request: ResearchWorkflowInput,
    fetched_count: int,
    source_fetch_limit: int,
) -> dict:
    score = 75 if fetched_count > 0 else 55
    priority = "high" if score >= 70 else "medium"
    recommendation = (
        f"Tạo bài viết chuyên sâu về {request.topic_title} với checklist, so sánh "
        "và hướng dẫn hành động."
    )
    warnings = []
    if fetched_count < source_fetch_limit:
        warnings.append(
            f"Chỉ lấy được {fetched_count}/{source_fetch_limit} nguồn, cần kiểm chứng thêm."
        )

    return {
        "score": score,
        "priority": priority,
        "recommendation": recommendation,
        "metadata": {
            "fetched_sources": fetched_count,
            "source_fetch_limit": source_fetch_limit,
            "warnings": warnings,
            "competitor_analysis": [],
            "cross_serp_analysis": None,
            "angle": "Hướng dẫn thực tế dựa trên phân tích nội dung cạnh tranh",
            "audience": request.market,
            "reasons": [
                "Chủ đề có nhu cầu tìm hiểu trước khi ra quyết định.",
                "Có thể tạo khác biệt bằng checklist và khuyến nghị cụ thể.",
            ],
        },
    }


def canonicalize_url(url: str) -> str:
    if not url:
        return ""
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    path = parsed.path.rstrip("/") or "/"
    return f"{parsed.scheme.lower()}://{hostname}{path}"
