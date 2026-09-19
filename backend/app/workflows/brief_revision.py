from dataclasses import dataclass
from typing import Any
from uuid import UUID

from app.ai.provider import AIUsage, StructuredOutputProvider
from app.prompts import brief_revision
from app.schemas.briefs import ContentBriefGeneration
from app.workflows.core import WorkflowContext, WorkflowError, WorkflowRunner


@dataclass(frozen=True)
class BriefRevisionWorkflowInput:
    revision_request: str
    current_brief: dict[str, Any]


@dataclass(frozen=True)
class BriefRevisionWorkflowResult:
    generation: ContentBriefGeneration
    provider: str
    model: str
    usage: AIUsage


class ReviseBriefStep:
    name = "revise_brief"

    def __init__(self, provider: StructuredOutputProvider) -> None:
        self.provider = provider

    def execute(self, context: WorkflowContext) -> BriefRevisionWorkflowResult:
        request = BriefRevisionWorkflowInput(**context.input)
        prompt_input = brief_revision.BriefRevisionPromptInput(
            revision_request=request.revision_request,
            current_brief=request.current_brief,
        )
        result = self.provider.generate_structured(
            system_prompt=brief_revision.SYSTEM_PROMPT,
            user_prompt=brief_revision.build_user_prompt(prompt_input, ContentBriefGeneration),
            output_model=ContentBriefGeneration,
        )
        return BriefRevisionWorkflowResult(
            generation=result.output,
            provider=result.provider,
            model=result.model,
            usage=result.usage,
        )


class BriefRevisionWorkflow:
    def __init__(self, provider: StructuredOutputProvider) -> None:
        self.runner = WorkflowRunner([ReviseBriefStep(provider)])

    def run(
        self,
        *,
        run_id: UUID,
        workspace_id: UUID,
        request: BriefRevisionWorkflowInput,
    ) -> BriefRevisionWorkflowResult:
        context = WorkflowContext(
            run_id=run_id,
            workspace_id=workspace_id,
            input={
                "revision_request": request.revision_request,
                "current_brief": request.current_brief,
            },
        )
        result = self.runner.run(context)
        output = result.step_outputs["revise_brief"]
        if not isinstance(output, BriefRevisionWorkflowResult):
            raise WorkflowError(
                "revise_brief",
                TypeError("Brief revision step returned an invalid result"),
            )
        return output
