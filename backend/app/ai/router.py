import json
from dataclasses import dataclass

from pydantic import ValidationError

from app.integrations.openai_client import OpenAIClient, OpenAIClientError
from app.prompts import topic_discovery
from app.schemas.ai import AIProviderMetadata, TopicDiscoveryAIResponse
from app.schemas.discovery import DiscoveryGeneration


class AIError(Exception):
    error_code = "AI_PROVIDER_UNAVAILABLE"
    message = "AI provider is temporarily unavailable."


class AIInvalidResponseError(AIError):
    error_code = "AI_INVALID_RESPONSE"
    message = "AI returned an invalid response."


@dataclass(frozen=True)
class TopicDiscoveryInput:
    industry: str
    market: str
    period_days: int
    result_count: int


class AIRouter:
    def __init__(self, client: OpenAIClient) -> None:
        self.client = client

    def run_topic_discovery(self, request: TopicDiscoveryInput) -> TopicDiscoveryAIResponse:
        prompt_input = topic_discovery.TopicDiscoveryPromptInput(
            industry=request.industry,
            market=request.market,
            period_days=request.period_days,
            result_count=request.result_count,
        )
        try:
            provider_result = self.client.generate_json(
                system_prompt=topic_discovery.SYSTEM_PROMPT,
                user_prompt=topic_discovery.build_user_prompt(prompt_input),
            )
            generation = parse_topic_discovery_generation(
                provider_result.text,
                expected_count=request.result_count,
            )
        except OpenAIClientError as exc:
            raise AIError from exc

        return TopicDiscoveryAIResponse(
            generation=generation,
            metadata=AIProviderMetadata(
                provider=provider_result.provider,
                model=provider_result.model,
                input_tokens=provider_result.usage.input_tokens,
                output_tokens=provider_result.usage.output_tokens,
                prompt_version=topic_discovery.PROMPT_VERSION,
            ),
        )


def parse_topic_discovery_generation(text: str, expected_count: int) -> DiscoveryGeneration:
    try:
        decoded = json.loads(text)
        generation = DiscoveryGeneration.model_validate(decoded)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise AIInvalidResponseError from exc

    deduped = dedupe_topics(generation)
    if len(deduped.topics) == 0:
        raise AIInvalidResponseError

    return DiscoveryGeneration(topics=deduped.topics[:expected_count])


def dedupe_topics(generation: DiscoveryGeneration) -> DiscoveryGeneration:
    seen: set[str] = set()
    topics = []
    for topic in generation.topics:
        key = " ".join(topic.title.lower().split())
        if key in seen:
            continue
        seen.add(key)
        topics.append(topic)

    return DiscoveryGeneration(topics=topics)
