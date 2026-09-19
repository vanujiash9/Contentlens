from dataclasses import dataclass
from typing import Generic, Protocol, TypeVar

from pydantic import BaseModel

StructuredOutput = TypeVar("StructuredOutput", bound=BaseModel)


class AIProviderError(Exception):
    error_code = "AI_PROVIDER_UNAVAILABLE"
    message = "AI provider is temporarily unavailable."


class AIProviderNotConfiguredError(AIProviderError):
    error_code = "AI_NOT_CONFIGURED"
    message = "AI provider is not configured."


class AIProviderInvalidResponseError(AIProviderError):
    error_code = "AI_INVALID_RESPONSE"
    message = "AI provider returned an invalid response."


@dataclass(frozen=True)
class AIUsage:
    input_tokens: int | None = None
    output_tokens: int | None = None


@dataclass(frozen=True)
class StructuredGenerationResult(Generic[StructuredOutput]):
    output: StructuredOutput
    provider: str
    model: str
    usage: AIUsage


class StructuredOutputProvider(Protocol):
    def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        output_model: type[StructuredOutput],
        temperature: float = 0.4,
    ) -> StructuredGenerationResult[StructuredOutput]:
        ...
