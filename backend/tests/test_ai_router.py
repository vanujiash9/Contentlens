import pytest

from app.ai.provider import AIProviderInvalidResponseError, AIUsage, StructuredGenerationResult
from app.ai.router import AIInvalidResponseError, AIRouter, TopicDiscoveryInput
from app.schemas.discovery import DiscoveryGeneration


class StubStructuredOutputProvider:
    def __init__(
        self,
        generation: DiscoveryGeneration | None = None,
        should_fail: bool = False,
    ) -> None:
        self.generation = generation
        self.should_fail = should_fail

    def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        output_model: type[DiscoveryGeneration],
        temperature: float = 0.4,
    ) -> StructuredGenerationResult[DiscoveryGeneration]:
        assert "ContentLens Topic Discovery AI" in system_prompt
        assert "Generate 2 content opportunity topic ideas" in user_prompt
        assert output_model is DiscoveryGeneration
        assert temperature == 0.4
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


def make_topic(title: str = "Yamaha U3 buyer guide") -> dict:
    return {
        "title": title,
        "opportunity_score": 86,
        "priority": "high",
        "search_signals": {
            "score": 80,
            "level": "high",
            "source": "AI estimate",
            "evidence": "Strong search interest.",
        },
        "content_gap": {
            "score": 75,
            "level": "medium",
            "source": "AI estimate",
            "evidence": "Existing content misses buying criteria.",
        },
        "business_relevance": {
            "score": 90,
            "level": "high",
            "source": "AI estimate",
            "evidence": "Matches high-intent shoppers.",
        },
        "angle": "Practical buying checklist",
        "reasoning": "Useful for piano shoppers.",
    }


def make_generation(*titles: str) -> DiscoveryGeneration:
    topic_titles = titles or ("Yamaha U3 buyer guide",)
    return DiscoveryGeneration.model_validate(
        {"topics": [make_topic(title) for title in topic_titles]}
    )


def make_generation_json(*titles: str) -> str:
    return make_generation(*titles).model_dump_json()


def make_request() -> TopicDiscoveryInput:
    return TopicDiscoveryInput(
        industry="Piano & nhạc cụ phím",
        market="Việt Nam",
        period_days=30,
        result_count=2,
    )


def test_run_topic_discovery_validates_generation() -> None:
    router = AIRouter(StubStructuredOutputProvider(make_generation()))

    result = router.run_topic_discovery(make_request())

    assert result.generation.topics[0].title == "Yamaha U3 buyer guide"
    assert result.metadata.provider == "test-provider"
    assert result.metadata.input_tokens == 10
    assert result.metadata.prompt_version == "topic_discovery_v1"


def test_run_topic_discovery_rejects_provider_invalid_response() -> None:
    router = AIRouter(StubStructuredOutputProvider(should_fail=True))

    with pytest.raises(AIInvalidResponseError):
        router.run_topic_discovery(make_request())


def test_run_topic_discovery_rejects_empty_generation() -> None:
    generation = DiscoveryGeneration.model_construct(topics=[])
    router = AIRouter(StubStructuredOutputProvider(generation))

    with pytest.raises(AIInvalidResponseError):
        router.run_topic_discovery(make_request())


def test_run_topic_discovery_dedupes_normalized_titles() -> None:
    router = AIRouter(
        StubStructuredOutputProvider(
            make_generation("Yamaha U3 buyer guide", "  yamaha   u3 buyer guide ")
        )
    )

    result = router.run_topic_discovery(make_request())

    assert len(result.generation.topics) == 1
