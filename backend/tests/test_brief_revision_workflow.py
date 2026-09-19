from uuid import UUID

import pytest

from app.ai.provider import AIProviderInvalidResponseError, AIUsage, StructuredGenerationResult
from app.schemas.briefs import ContentBriefGeneration
from app.workflows.brief_revision import BriefRevisionWorkflow, BriefRevisionWorkflowInput
from app.workflows.core import WorkflowError
from tests.test_content_brief_workflow import make_brief_generation

RUN_ID = UUID("30000000-0000-0000-0000-000000000001")
WORKSPACE_ID = UUID("10000000-0000-0000-0000-000000000001")


class StubStructuredOutputProvider:
    def __init__(self, generation: ContentBriefGeneration | None = None, should_fail: bool = False) -> None:
        self.generation = generation
        self.should_fail = should_fail
        self.output_model = None
        self.user_prompt = ""

    def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        output_model: type[ContentBriefGeneration],
        temperature: float = 0.4,
    ) -> StructuredGenerationResult[ContentBriefGeneration]:
        assert "ContentLens brief revision AI" in system_prompt
        assert temperature == 0.4
        self.output_model = output_model
        self.user_prompt = user_prompt
        if self.should_fail:
            raise AIProviderInvalidResponseError
        if self.generation is None:
            raise AssertionError("Stub generation is required")
        return StructuredGenerationResult(
            output=self.generation,
            provider="test-provider",
            model="test-model",
            usage=AIUsage(input_tokens=10, output_tokens=20),
        )


def make_request() -> BriefRevisionWorkflowInput:
    return BriefRevisionWorkflowInput(
        revision_request="Viết lại phần kết luận theo hướng tư vấn thực tế hơn.",
        current_brief={
            "title": "Hướng dẫn mua Yamaha U3",
            "draft": "Bản nháp ban đầu",
            "quality_warnings": ["Thiếu nguồn giá thực tế."],
        },
    )


def test_brief_revision_workflow_generates_revised_brief() -> None:
    provider = StubStructuredOutputProvider(make_brief_generation().model_copy(update={"draft": "Bản nháp đã sửa"}))
    workflow = BriefRevisionWorkflow(provider)

    result = workflow.run(run_id=RUN_ID, workspace_id=WORKSPACE_ID, request=make_request())

    assert provider.output_model is ContentBriefGeneration
    assert "Viết lại phần kết luận" in provider.user_prompt
    assert "Bản nháp ban đầu" in provider.user_prompt
    assert result.generation.draft == "Bản nháp đã sửa"
    assert result.provider == "test-provider"
    assert result.usage.input_tokens == 10


def test_brief_revision_workflow_wraps_provider_invalid_response() -> None:
    workflow = BriefRevisionWorkflow(StubStructuredOutputProvider(should_fail=True))

    with pytest.raises(WorkflowError) as exc_info:
        workflow.run(run_id=RUN_ID, workspace_id=WORKSPACE_ID, request=make_request())

    assert exc_info.value.step_name == "revise_brief"
