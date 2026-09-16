from dataclasses import dataclass
from typing import Any, Literal

import httpx

from app.core.config import Settings

PROVIDER_NAME = "openai-compatible"


class OpenAIClientError(Exception):
    error_code = "AI_PROVIDER_UNAVAILABLE"
    message = "AI provider is temporarily unavailable."


class OpenAIClientNotConfiguredError(OpenAIClientError):
    error_code = "AI_NOT_CONFIGURED"
    message = "AI provider is not configured."


class OpenAIClientInvalidResponseError(OpenAIClientError):
    error_code = "AI_INVALID_RESPONSE"
    message = "AI provider returned an invalid response."


@dataclass(frozen=True)
class OpenAIUsage:
    input_tokens: int | None = None
    output_tokens: int | None = None


@dataclass(frozen=True)
class OpenAIProviderResult:
    text: str
    provider: str
    model: str
    usage: OpenAIUsage


class OpenAIClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.4,
    ) -> OpenAIProviderResult:
        if not self._is_configured():
            raise OpenAIClientNotConfiguredError

        body = self._post_chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            response_format={"type": "json_object"},
        )
        text = extract_response_text(body)
        usage = body.get("usage") or {}

        return OpenAIProviderResult(
            text=text,
            provider=PROVIDER_NAME,
            model=self.settings.openai_model or "unknown",
            usage=OpenAIUsage(
                input_tokens=usage.get("prompt_tokens"),
                output_tokens=usage.get("completion_tokens"),
            ),
        )

    def _post_chat_completion(
        self,
        *,
        messages: list[dict[str, str]],
        temperature: float,
        response_format: dict[str, Literal["json_object"]],
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


def extract_response_text(body: dict[str, Any]) -> str:
    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise OpenAIClientInvalidResponseError from exc

    if not isinstance(content, str) or len(content.strip()) == 0:
        raise OpenAIClientInvalidResponseError

    return content
