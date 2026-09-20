from dataclasses import dataclass
from uuid import UUID

import pytest

from app.ai.provider import AIProviderInvalidResponseError, AIUsage, StructuredGenerationResult
from app.integrations.search_provider import SearchResult
from app.schemas.discovery import DiscoveryGeneration
from app.workflows.core import WorkflowContext, WorkflowError, WorkflowRunner, WorkflowStep
from app.workflows.topic_discovery import TopicDiscoveryWorkflow, TopicDiscoveryWorkflowInput
from tests.test_ai_router import make_generation

RUN_ID = UUID("30000000-0000-0000-0000-000000000001")
WORKSPACE_ID = UUID("10000000-0000-0000-0000-000000000001")


@dataclass(frozen=True)
class RecordingStep:
    name: str
    output: str
    calls: list[str]

    def execute(self, context: WorkflowContext) -> str:
        self.calls.append(self.name)
        assert context.run_id == RUN_ID
        assert context.workspace_id == WORKSPACE_ID
        return self.output


class FailingStep:
    name = "failing_step"

    def execute(self, context: WorkflowContext) -> None:
        _ = context
        raise ValueError("boom")


class StubSearchProvider:
    def search(self, query: str, limit: int) -> list[SearchResult]:
        assert limit == 5
        return [
            SearchResult(
                title=f"Top result for {query}",
                url="https://example.com/piano",
                snippet="SERP evidence about piano buyer intent and comparison gaps.",
                rank=1,
                source="test",
            )
        ]


class StubStructuredOutputProvider:
    def __init__(
        self,
        generation: DiscoveryGeneration | None = None,
        should_fail: bool = False,
    ) -> None:
        self.generation = generation
        self.should_fail = should_fail
        self.output_model = None

    def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        output_model: type[DiscoveryGeneration],
        temperature: float = 0.4,
    ) -> StructuredGenerationResult[DiscoveryGeneration]:
        assert "ContentLens Topic Discovery AI" in system_prompt
        assert "Generate 2 SEO content opportunity topic ideas" in user_prompt
        assert "SERP evidence about piano buyer intent" in user_prompt
        assert temperature == 0.4
        self.output_model = output_model
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


def make_context() -> WorkflowContext:
    return WorkflowContext(
        run_id=RUN_ID,
        workspace_id=WORKSPACE_ID,
        input={"industry": "Piano"},
    )


def test_workflow_runner_executes_steps_in_order() -> None:
    calls: list[str] = []
    steps: list[WorkflowStep] = [
        RecordingStep(name="first", output="one", calls=calls),
        RecordingStep(name="second", output="two", calls=calls),
    ]

    result = WorkflowRunner(steps).run(make_context())

    assert calls == ["first", "second"]
    assert result.step_outputs == {"first": "one", "second": "two"}


def test_workflow_runner_wraps_step_errors() -> None:
    with pytest.raises(WorkflowError) as exc_info:
        WorkflowRunner([FailingStep()]).run(make_context())

    assert exc_info.value.step_name == "failing_step"


def test_topic_discovery_workflow_generates_deduped_topics() -> None:
    provider = StubStructuredOutputProvider(
        make_generation("Yamaha U3 buyer guide", "  yamaha   u3 buyer guide ")
    )
    workflow = TopicDiscoveryWorkflow(provider, StubSearchProvider())

    result = workflow.run(
        run_id=RUN_ID,
        workspace_id=WORKSPACE_ID,
        request=TopicDiscoveryWorkflowInput(
            industry="Piano & nhạc cụ phím",
            market="Việt Nam",
            period_days=30,
            result_count=2,
        ),
    )

    assert provider.output_model is DiscoveryGeneration
    assert result.generation.topics[0].title == "Yamaha U3 buyer guide"
    assert len(result.generation.topics) == 1
    assert result.provider == "test-provider"
    assert result.usage.input_tokens == 10


def test_topic_discovery_workflow_maps_provider_invalid_response() -> None:
    workflow = TopicDiscoveryWorkflow(
        StubStructuredOutputProvider(should_fail=True),
        StubSearchProvider(),
    )

    with pytest.raises(WorkflowError) as exc_info:
        workflow.run(
            run_id=RUN_ID,
            workspace_id=WORKSPACE_ID,
            request=TopicDiscoveryWorkflowInput(
                industry="Piano & nhạc cụ phím",
                market="Việt Nam",
                period_days=30,
                result_count=2,
            ),
        )

    assert exc_info.value.step_name == "generate_topics"
