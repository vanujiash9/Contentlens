from dataclasses import dataclass, field
from uuid import UUID, uuid4

from app.ai.provider import AIUsage, StructuredGenerationResult
from app.integrations.search_provider import SearchResult
from app.integrations.source_fetcher import FetchedSource, SourceHeading
from app.schemas.research import ResearchAnalysisGeneration
from app.workflows.research import ResearchWorkflow, ResearchWorkflowInput

RUN_ID = UUID("30000000-0000-0000-0000-000000000001")
WORKSPACE_ID = UUID("10000000-0000-0000-0000-000000000001")
TOPIC_ID = UUID("20000000-0000-0000-0000-000000000001")


class StubSearchProvider:
    def search(self, query: str, limit: int) -> list[SearchResult]:
        assert limit == 10
        return [
            SearchResult(
                title=f"Competitor {index}",
                url=f"https://example.com/article-{index}",
                snippet=f"Snippet {index}",
                rank=index,
                source="test",
            )
            for index in range(1, 7)
        ]


class StubSourceFetcher:
    def fetch(self, url: str) -> FetchedSource:
        index = url.rsplit("-", 1)[-1]
        return FetchedSource(
            url=url,
            title=f"Fetched competitor {index}",
            domain="example.com",
            text=(
                f"Full cleaned text for competitor {index}. "
                "Ví dụ: bài viết có checklist và câu hỏi thường gặp."
            ),
            status_code=200,
            headings=[
                SourceHeading(level="h1", text=f"Main heading {index}"),
                SourceHeading(level="h2", text="Buying checklist"),
            ],
            word_count=1200 + int(index),
            questions=["Should you buy this piano?"],
            examples=["Ví dụ: checklist kiểm tra đàn."],
            tables_count=1,
            images_count=2,
            videos_count=1,
        )


@dataclass
class RecordingResearchRepository:
    sources: list[dict] = field(default_factory=list)
    opportunities: list[dict] = field(default_factory=list)
    findings: list[dict] = field(default_factory=list)
    gaps: list[dict] = field(default_factory=list)
    plans: list[dict] = field(default_factory=list)

    def upsert_plan(self, *, workspace_id: UUID, topic_id: UUID, plan: dict) -> dict:
        row = {"workspace_id": str(workspace_id), "topic_id": str(topic_id), **plan}
        self.plans.append(row)
        return row

    def create_query(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        query: str,
        result_count: int,
    ) -> dict:
        return {
            "id": str(uuid4()),
            "workspace_id": str(workspace_id),
            "topic_id": str(topic_id),
            "query": query,
            "result_count": result_count,
        }

    def insert_serp_results(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        query_id: UUID,
        results: list[SearchResult],
    ) -> list[dict]:
        rows = [
            {
                "id": str(uuid4()),
                "workspace_id": str(workspace_id),
                "topic_id": str(topic_id),
                "query_id": str(query_id),
                "title": result.title,
                "url": result.url,
                "rank": result.rank,
                "snippet": result.snippet,
                "status": "pending",
            }
            for result in results
        ]
        self.sources.extend(rows)
        return rows

    def mark_source_fetched(
        self,
        *,
        source_id: UUID,
        fetched_source: FetchedSource,
    ) -> dict:
        row = next(source for source in self.sources if source["id"] == str(source_id))
        fetched_row = {
            **row,
            "title": fetched_source.title,
            "url": fetched_source.url,
            "domain": fetched_source.domain,
            "status": "fetched",
            "extracted_text": fetched_source.text,
            "headings": [heading.__dict__ for heading in fetched_source.headings],
            "word_count": fetched_source.word_count,
            "questions": fetched_source.questions,
            "examples": fetched_source.examples,
            "tables_count": fetched_source.tables_count,
            "images_count": fetched_source.images_count,
            "videos_count": fetched_source.videos_count,
        }
        self.sources = [
            fetched_row if source["id"] == str(source_id) else source
            for source in self.sources
        ]
        return fetched_row

    def mark_source_failed(self, *, source_id: UUID, error_message: str) -> dict:
        return {"id": str(source_id), "status": "failed", "error_message": error_message}

    def insert_findings(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        findings: list[dict],
    ) -> list[dict]:
        _ = workspace_id
        _ = topic_id
        self.findings = findings
        return findings

    def insert_information_gaps(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        gaps: list[dict],
    ) -> list[dict]:
        _ = workspace_id
        _ = topic_id
        self.gaps = gaps
        return gaps

    def upsert_opportunity(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        opportunity: dict,
    ) -> dict:
        _ = workspace_id
        _ = topic_id
        self.opportunities.append(opportunity)
        return opportunity


class StubStructuredOutputProvider:
    def __init__(self) -> None:
        self.user_prompt = ""

    def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        output_model: type[ResearchAnalysisGeneration],
        temperature: float = 0.4,
    ) -> StructuredGenerationResult[ResearchAnalysisGeneration]:
        _ = system_prompt
        _ = temperature
        self.user_prompt = user_prompt
        return StructuredGenerationResult(
            output=output_model.model_validate(
                {
                    "findings": [
                        {
                            "claim": "Competitors use buying checklists.",
                            "finding_type": "pattern",
                            "source_urls": ["https://example.com/article-1"],
                        }
                    ],
                    "information_gaps": [
                        {
                            "description": "Competitors miss local warranty guidance.",
                            "recommendation": "Add Vietnam-specific warranty advice.",
                        }
                    ],
                    "opportunity": {
                        "score": 82,
                        "priority": "high",
                        "recommendation": "Create a deeper buyer guide.",
                        "angle": "Vietnam-specific piano buying checklist",
                        "audience": "Vietnam buyers",
                        "reasons": ["SERP has gaps"],
                    },
                    "competitors": [
                        {
                            "source_url": "https://example.com/article-1",
                            "source_title": "Fetched competitor 1",
                            "rank": 1,
                            "intent": "Compare before buying",
                            "main_angle": "Checklist",
                            "strengths": ["Clear structure"],
                            "weaknesses": ["Thin local context"],
                            "content_depth": "moderate",
                            "unique_value": "Simple checklist",
                            "topics": ["Buying piano"],
                            "subtopics": ["Warranty"],
                            "questions_answered": ["Should you buy this piano?"],
                            "entities": ["Yamaha U3"],
                            "examples": ["Ví dụ: checklist kiểm tra đàn."],
                            "media_evidence": {
                                "tables_count": 1,
                                "images_count": 2,
                                "videos_count": 1,
                            },
                        }
                    ],
                    "cross_serp_analysis": {
                        "common_patterns": ["Buyer checklist"],
                        "must_cover_topics": ["Warranty"],
                        "content_gaps": ["Vietnam-specific advice"],
                        "weak_explanations": ["Maintenance costs"],
                        "unanswered_questions": ["How to verify serial number?"],
                        "differentiation_opportunities": ["Local checklist"],
                        "information_gain_opportunities": ["Add inspection workflow"],
                    },
                    "warnings": [],
                }
            ),
            provider="test-provider",
            model="test-model",
            usage=AIUsage(input_tokens=10, output_tokens=20),
        )


def test_research_workflow_passes_fetched_competitor_evidence_to_ai() -> None:
    repository = RecordingResearchRepository()
    provider = StubStructuredOutputProvider()
    workflow = ResearchWorkflow(
        repository,
        StubSearchProvider(),
        StubSourceFetcher(),
        provider,
        source_fetch_limit=5,
    )

    result = workflow.run(
        run_id=RUN_ID,
        workspace_id=WORKSPACE_ID,
        request=ResearchWorkflowInput(topic_id=TOPIC_ID, topic_title="Yamaha U3"),
    )

    assert result.fetched_sources_count == 5
    assert repository.plans[0]["workspace_id"] == str(WORKSPACE_ID)
    assert "Main heading 1" in provider.user_prompt
    assert "Full cleaned text for competitor 1" in provider.user_prompt
    assert "Word count: 1201" in provider.user_prompt
    assert "Tables: 1" in provider.user_prompt
    metadata = repository.opportunities[0]["metadata"]
    assert metadata["competitor_analysis"][0]["source_url"] == "https://example.com/article-1"
    assert metadata["cross_serp_analysis"]["must_cover_topics"] == ["Warranty"]


def test_research_workflow_fallback_has_stable_structured_metadata() -> None:
    repository = RecordingResearchRepository()
    workflow = ResearchWorkflow(
        repository,
        StubSearchProvider(),
        StubSourceFetcher(),
        analysis_provider=None,
        source_fetch_limit=5,
    )

    workflow.run(
        run_id=RUN_ID,
        workspace_id=WORKSPACE_ID,
        request=ResearchWorkflowInput(topic_id=TOPIC_ID, topic_title="Yamaha U3"),
    )

    metadata = repository.opportunities[0]["metadata"]
    assert metadata["competitor_analysis"] == []
    assert metadata["cross_serp_analysis"] is None
