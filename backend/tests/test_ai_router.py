import json

import pytest

from app.ai.router import AIInvalidResponseError, AIRouter, TopicDiscoveryInput
from app.integrations.openai_client import OpenAIProviderResult, OpenAIUsage


class StubOpenAIClient:
    def __init__(self, text: str) -> None:
        self.text = text

    def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.4,
    ) -> OpenAIProviderResult:
        assert "ContentLens Topic Discovery AI" in system_prompt
        assert "Generate 2 content opportunity topic ideas" in user_prompt
        assert temperature == 0.4
        return OpenAIProviderResult(
            text=self.text,
            provider="test-provider",
            model="test-model",
            usage=OpenAIUsage(input_tokens=10, output_tokens=20),
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


def make_generation_json(*titles: str) -> str:
    topic_titles = titles or ("Yamaha U3 buyer guide",)
    return json.dumps({"topics": [make_topic(title) for title in topic_titles]})


def make_request() -> TopicDiscoveryInput:
    return TopicDiscoveryInput(
        industry="Piano & nhạc cụ phím",
        market="Việt Nam",
        period_days=30,
        result_count=2,
    )


def test_run_topic_discovery_validates_generation() -> None:
    router = AIRouter(StubOpenAIClient(make_generation_json()))

    result = router.run_topic_discovery(make_request())

    assert result.generation.topics[0].title == "Yamaha U3 buyer guide"
    assert result.metadata.provider == "test-provider"
    assert result.metadata.input_tokens == 10
    assert result.metadata.prompt_version == "topic_discovery_v1"


def test_run_topic_discovery_rejects_malformed_json() -> None:
    router = AIRouter(StubOpenAIClient("not json"))

    with pytest.raises(AIInvalidResponseError):
        router.run_topic_discovery(make_request())


def test_run_topic_discovery_rejects_schema_invalid_json() -> None:
    router = AIRouter(StubOpenAIClient('{"topics": [{"title": "missing fields"}]}'))

    with pytest.raises(AIInvalidResponseError):
        router.run_topic_discovery(make_request())


def test_run_topic_discovery_dedupes_normalized_titles() -> None:
    router = AIRouter(
        StubOpenAIClient(
            make_generation_json("Yamaha U3 buyer guide", "  yamaha   u3 buyer guide ")
        )
    )

    result = router.run_topic_discovery(make_request())

    assert len(result.generation.topics) == 1
