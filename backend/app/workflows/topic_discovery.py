from dataclasses import dataclass
from uuid import UUID

from app.ai.provider import AIUsage, StructuredOutputProvider
from app.ai.router import dedupe_topics
from app.integrations.search_provider import SearchProvider, SearchProviderError, SearchResult
from app.prompts import topic_discovery
from app.schemas.discovery import DiscoveryGeneration
from app.workflows.core import WorkflowContext, WorkflowError, WorkflowRunner


@dataclass(frozen=True)
class TopicDiscoveryWorkflowInput:
    industry: str
    market: str
    period_days: int
    result_count: int


@dataclass(frozen=True)
class TopicDiscoveryWorkflowResult:
    generation: DiscoveryGeneration
    provider: str
    model: str
    usage: AIUsage


class GenerateTopicsStep:
    name = "generate_topics"

    def __init__(
        self,
        provider: StructuredOutputProvider,
        search_provider: SearchProvider,
    ) -> None:
        self.provider = provider
        self.search_provider = search_provider

    def execute(self, context: WorkflowContext) -> TopicDiscoveryWorkflowResult:
        request = TopicDiscoveryWorkflowInput(**context.input)
        search_evidence = self._collect_search_evidence(request)
        prompt_input = topic_discovery.TopicDiscoveryPromptInput(
            industry=request.industry,
            market=request.market,
            period_days=request.period_days,
            result_count=request.result_count,
            search_evidence=search_evidence,
        )
        result = self.provider.generate_structured(
            system_prompt=topic_discovery.SYSTEM_PROMPT,
            user_prompt=topic_discovery.build_user_prompt(prompt_input),
            output_model=DiscoveryGeneration,
        )
        generation = dedupe_topics(result.output)
        return TopicDiscoveryWorkflowResult(
            generation=DiscoveryGeneration(topics=generation.topics[: request.result_count]),
            provider=result.provider,
            model=result.model,
            usage=result.usage,
        )

    def _collect_search_evidence(self, request: TopicDiscoveryWorkflowInput) -> str:
        queries = build_discovery_queries(request)
        sections = []
        for query in queries:
            try:
                results = self.search_provider.search(query, limit=5)
            except SearchProviderError:
                continue
            sections.append(format_search_results(query, results))

        evidence = "\n\n".join(section for section in sections if section)
        return evidence or "No search evidence available."


def build_discovery_queries(request: TopicDiscoveryWorkflowInput) -> list[str]:
    return [
        f"{request.industry} {request.market} xu hướng tìm kiếm",
        f"{request.industry} {request.market} câu hỏi thường gặp",
        f"{request.industry} {request.market} hướng dẫn mua so sánh",
    ]


def format_search_results(query: str, results: list[SearchResult]) -> str:
    if not results:
        return ""

    lines = [f"Query: {query}"]
    for result in results:
        rank = result.rank or "?"
        lines.append(
            f"- Rank {rank}: {result.title}\n  URL: {result.url}\n  Snippet: {result.snippet}"
        )
    return "\n".join(lines)


class TopicDiscoveryWorkflow:
    def __init__(self, provider: StructuredOutputProvider, search_provider: SearchProvider) -> None:
        self.runner = WorkflowRunner([GenerateTopicsStep(provider, search_provider)])

    def run(
        self,
        *,
        run_id: UUID,
        workspace_id: UUID,
        request: TopicDiscoveryWorkflowInput,
    ) -> TopicDiscoveryWorkflowResult:
        context = WorkflowContext(
            run_id=run_id,
            workspace_id=workspace_id,
            input={
                "industry": request.industry,
                "market": request.market,
                "period_days": request.period_days,
                "result_count": request.result_count,
            },
        )
        result = self.runner.run(context)
        output = result.step_outputs["generate_topics"]
        if not isinstance(output, TopicDiscoveryWorkflowResult):
            raise WorkflowError(
                "generate_topics",
                TypeError("Topic discovery step returned an invalid result"),
            )
        return output
