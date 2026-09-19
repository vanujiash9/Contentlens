from dataclasses import dataclass
from uuid import UUID

from app.ai.provider import AIUsage, StructuredOutputProvider
from app.ai.router import dedupe_topics
from app.prompts import topic_discovery
from app.schemas.discovery import DiscoveryGeneration
from app.workflows.core import WorkflowContext, WorkflowError, WorkflowRunner, WorkflowStep


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

    def __init__(self, provider: StructuredOutputProvider) -> None:
        self.provider = provider

    def execute(self, context: WorkflowContext) -> TopicDiscoveryWorkflowResult:
        request = TopicDiscoveryWorkflowInput(**context.input)
        prompt_input = topic_discovery.TopicDiscoveryPromptInput(
            industry=request.industry,
            market=request.market,
            period_days=request.period_days,
            result_count=request.result_count,
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


class TopicDiscoveryWorkflow:
    def __init__(self, provider: StructuredOutputProvider) -> None:
        self.runner = WorkflowRunner([GenerateTopicsStep(provider)])

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
