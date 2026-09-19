from uuid import UUID

import pytest

from app.ai.provider import AIProviderInvalidResponseError, AIUsage, StructuredGenerationResult
from app.schemas.briefs import ContentBriefGeneration
from app.workflows.content_brief import ContentBriefWorkflow, ContentBriefWorkflowInput
from app.workflows.core import WorkflowError

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
        assert "ContentLens Content Brief AI" in system_prompt
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


def make_brief_generation() -> ContentBriefGeneration:
    return ContentBriefGeneration(
        title="Hướng dẫn mua Yamaha U3",
        search_intent="So sánh và chọn mua piano Yamaha U3 đã qua sử dụng.",
        target_audience="Người mua piano gia đình tại Việt Nam.",
        objective="Giúp người đọc tự tin chọn đàn phù hợp.",
        angle="Checklist thực tế trước khi mua.",
        key_questions=["Yamaha U3 có phù hợp không?"],
        outline=[{"heading": "Kiểm tra đàn", "points": ["Âm thanh", "Bộ máy"]}],
        key_facts=["Cần kiểm tra serial và tình trạng máy."],
        must_cover=["Checklist kiểm tra."],
        must_avoid=["Không bịa giá thị trường."],
        evidence_map=[{"claim": "Cần kiểm tra serial", "evidence": "Thông tin người bán"}],
        quality_checks=["Có checklist hành động."],
        quality_warnings=["Thiếu nguồn giá thực tế."],
    )


def make_request() -> ContentBriefWorkflowInput:
    return ContentBriefWorkflowInput(
        topic="Yamaha U3 buyer guide",
        industry="Piano & nhạc cụ phím",
        market="Việt Nam",
        audience="Người mua piano gia đình",
        search_intent="Mua Yamaha U3 cũ",
        angle="Checklist mua đàn",
        business_goal="Tăng lead tư vấn mua đàn",
        research_insights="Người mua lo về chất lượng đàn cũ.",
    )


def test_content_brief_workflow_generates_brief() -> None:
    provider = StubStructuredOutputProvider(make_brief_generation())
    workflow = ContentBriefWorkflow(provider)

    result = workflow.run(run_id=RUN_ID, workspace_id=WORKSPACE_ID, request=make_request())

    assert provider.output_model is ContentBriefGeneration
    assert "Yamaha U3 buyer guide" in provider.user_prompt
    assert result.generation.title == "Hướng dẫn mua Yamaha U3"
    assert result.provider == "test-provider"
    assert result.usage.input_tokens == 10


def test_content_brief_workflow_wraps_provider_invalid_response() -> None:
    workflow = ContentBriefWorkflow(StubStructuredOutputProvider(should_fail=True))

    with pytest.raises(WorkflowError) as exc_info:
        workflow.run(run_id=RUN_ID, workspace_id=WORKSPACE_ID, request=make_request())

    assert exc_info.value.step_name == "generate_brief"
