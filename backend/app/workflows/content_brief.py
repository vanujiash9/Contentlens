from dataclasses import dataclass
from uuid import UUID

from app.ai.provider import AIUsage, StructuredOutputProvider
from app.prompts import content_brief
from app.schemas.briefs import ContentBriefGeneration
from app.workflows.core import WorkflowContext, WorkflowError, WorkflowRunner


@dataclass(frozen=True)
class ContentBriefWorkflowInput:
    topic: str
    industry: str
    market: str
    audience: str
    search_intent: str
    angle: str
    business_goal: str
    research_insights: str


@dataclass(frozen=True)
class ContentBriefWorkflowResult:
    generation: ContentBriefGeneration
    provider: str
    model: str
    usage: AIUsage


class GenerateBriefStep:
    name = "generate_brief"

    def __init__(self, provider: StructuredOutputProvider) -> None:
        self.provider = provider

    def execute(self, context: WorkflowContext) -> ContentBriefWorkflowResult:
        request = ContentBriefWorkflowInput(**context.input)
        prompt_input = content_brief.ContentBriefPromptInput(
            topic=request.topic,
            industry=request.industry,
            market=request.market,
            audience=request.audience,
            search_intent=request.search_intent,
            angle=request.angle,
            business_goal=request.business_goal,
            research_insights=request.research_insights,
        )
        result = self.provider.generate_structured(
            system_prompt=content_brief.SYSTEM_PROMPT,
            user_prompt=content_brief.build_user_prompt(prompt_input, ContentBriefGeneration),
            output_model=ContentBriefGeneration,
        )
        return ContentBriefWorkflowResult(
            generation=result.output,
            provider=result.provider,
            model=result.model,
            usage=result.usage,
        )


class ContentBriefWorkflow:
    def __init__(self, provider: StructuredOutputProvider) -> None:
        self.runner = WorkflowRunner([GenerateBriefStep(provider)])

    def run(
        self,
        *,
        run_id: UUID,
        workspace_id: UUID,
        request: ContentBriefWorkflowInput,
    ) -> ContentBriefWorkflowResult:
        context = WorkflowContext(
            run_id=run_id,
            workspace_id=workspace_id,
            input={
                "topic": request.topic,
                "industry": request.industry,
                "market": request.market,
                "audience": request.audience,
                "search_intent": request.search_intent,
                "angle": request.angle,
                "business_goal": request.business_goal,
                "research_insights": request.research_insights,
            },
        )
        result = self.runner.run(context)
        output = result.step_outputs["generate_brief"]
        if not isinstance(output, ContentBriefWorkflowResult):
            raise WorkflowError(
                "generate_brief",
                TypeError("Content brief step returned an invalid result"),
            )
        return output
