from dataclasses import dataclass
from typing import Protocol

from fastapi import HTTPException, status

from app.ai.router import AIError, AIInvalidResponseError, AIRouter, TopicDiscoveryInput
from app.integrations.openai_client import OpenAIClient
from app.schemas.discovery import DiscoveryGeneration


class TopicDiscoveryError(Exception):
    error_code = "AI_PROVIDER_UNAVAILABLE"
    message = "AI discovery is temporarily unavailable."
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class TopicDiscoveryNotConfiguredError(TopicDiscoveryError):
    error_code = "AI_NOT_CONFIGURED"
    message = "AI discovery is not configured."


class TopicDiscoveryInvalidResponseError(TopicDiscoveryError):
    error_code = "AI_INVALID_RESPONSE"
    message = "AI returned an invalid discovery response."
    status_code = status.HTTP_502_BAD_GATEWAY


@dataclass(frozen=True)
class DiscoveryPromptInput:
    industry: str
    market: str
    period_days: int
    result_count: int


@dataclass(frozen=True)
class DiscoveryUsage:
    input_tokens: int | None = None
    output_tokens: int | None = None


@dataclass(frozen=True)
class DiscoveryProviderResult:
    generation: DiscoveryGeneration
    provider: str
    model: str
    usage: DiscoveryUsage


class TopicDiscoveryGenerator(Protocol):
    def generate(self, request: DiscoveryPromptInput) -> DiscoveryProviderResult:
        ...


class OpenAITopicDiscoveryGenerator:
    def __init__(self, ai_router: AIRouter) -> None:
        self.ai_router = ai_router

    @classmethod
    def from_client(cls, client: OpenAIClient) -> "OpenAITopicDiscoveryGenerator":
        return cls(AIRouter(client))

    def generate(self, request: DiscoveryPromptInput) -> DiscoveryProviderResult:
        try:
            response = self.ai_router.run_topic_discovery(
                TopicDiscoveryInput(
                    industry=request.industry,
                    market=request.market,
                    period_days=request.period_days,
                    result_count=request.result_count,
                )
            )
        except AIInvalidResponseError as exc:
            raise TopicDiscoveryInvalidResponseError from exc
        except AIError as exc:
            raise TopicDiscoveryError from exc

        return DiscoveryProviderResult(
            generation=response.generation,
            provider=response.metadata.provider,
            model=response.metadata.model,
            usage=DiscoveryUsage(
                input_tokens=response.metadata.input_tokens,
                output_tokens=response.metadata.output_tokens,
            ),
        )


def raise_discovery_http_error(error: TopicDiscoveryError) -> None:
    raise HTTPException(
        status_code=error.status_code,
        detail={"code": error.error_code, "message": error.message},
    ) from error
