import json
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.ai.provider import (
    AIProviderError,
    AIProviderInvalidResponseError,
    AIProviderNotConfiguredError,
    AIUsage,
    StructuredGenerationResult,
)
from app.core.config import Settings

PROVIDER_NAME = "openai-compatible"
StructuredOutput = TypeVar("StructuredOutput", bound=BaseModel)


class OpenAIClientError(AIProviderError):
    error_code = "AI_PROVIDER_UNAVAILABLE"
    message = "AI provider is temporarily unavailable."


class OpenAIClientNotConfiguredError(OpenAIClientError, AIProviderNotConfiguredError):
    error_code = "AI_NOT_CONFIGURED"
    message = "AI provider is not configured."


class OpenAIClientInvalidResponseError(OpenAIClientError, AIProviderInvalidResponseError):
    error_code = "AI_INVALID_RESPONSE"
    message = "AI provider returned an invalid response."


OpenAIUsage = AIUsage
OpenAIProviderResult = StructuredGenerationResult


class OpenAIClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        output_model: type[StructuredOutput],
        temperature: float = 0.4,
    ) -> StructuredGenerationResult[StructuredOutput]:
        if not self._is_configured():
            raise OpenAIClientNotConfiguredError

        body = self._post_chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            response_format=build_json_schema_response_format(output_model),
        )
        text = extract_response_text(body)
        usage = body.get("usage") or {}

        try:
            output = output_model.model_validate(json.loads(text))
        except (json.JSONDecodeError, ValidationError) as exc:
            raise OpenAIClientInvalidResponseError from exc

        return StructuredGenerationResult(
            output=output,
            provider=PROVIDER_NAME,
            model=self.settings.openai_model or "unknown",
            usage=AIUsage(
                input_tokens=usage.get("prompt_tokens"),
                output_tokens=usage.get("completion_tokens"),
            ),
        )

    def _post_chat_completion(
        self,
        *,
        messages: list[dict[str, str]],
        temperature: float,
        response_format: dict[str, Any],
    ) -> dict[str, Any]:
        base_url = str(self.settings.openai_base_url).rstrip("/")
        payload = {
            "model": self.settings.openai_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": self.settings.openai_max_output_tokens,
            "response_format": response_format,
        }
        attempts = max(1, self.settings.openai_max_retries + 1)
        last_error: httpx.HTTPError | None = None

        for _ in range(attempts):
            try:
                with httpx.Client(timeout=self.settings.openai_timeout_seconds) as client:
                    response = client.post(
                        f"{base_url}/chat/completions",
                        headers={
                            "Authorization": "Bearer "
                            f"{self.settings.openai_api_key.get_secret_value()}",
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPError as exc:
                last_error = exc
            except ValueError as exc:
                raise OpenAIClientInvalidResponseError from exc

        raise OpenAIClientError from last_error

    def _is_configured(self) -> bool:
        return (
            self.settings.ai_discovery_enabled
            and self.settings.openai_api_key is not None
            and self.settings.openai_base_url is not None
            and self.settings.openai_model is not None
        )


def build_json_schema_response_format(output_model: type[BaseModel]) -> dict[str, Any]:
    return {
        "type": "json_schema",
        "json_schema": {
            "name": output_model.__name__,
            "schema": output_model.model_json_schema(),
        },
    }


def extract_response_text(body: dict[str, Any]) -> str:
    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise OpenAIClientInvalidResponseError from exc

    if not isinstance(content, str) or len(content.strip()) == 0:
        raise OpenAIClientInvalidResponseError

    return content
