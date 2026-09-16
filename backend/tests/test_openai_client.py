import httpx
from pydantic import SecretStr

from app.core.config import Settings
from app.integrations.openai_client import (
    OpenAIClient,
    OpenAIClientError,
    OpenAIClientInvalidResponseError,
    OpenAIClientNotConfiguredError,
)


def make_settings() -> Settings:
    return Settings(
        OPENAI__API_KEY=SecretStr("test-key"),
        OPENAI__BASE_URL="https://api.example.test/v1",
        OPENAI__MODEL="test-model",
        OPENAI__TIMEOUT_SECONDS=5,
        OPENAI__MAX_RETRIES=0,
        OPENAI__MAX_OUTPUT_TOKENS=100,
    )


def test_generate_json_returns_text_and_usage(monkeypatch) -> None:
    request_payloads = []

    def handler(request: httpx.Request) -> httpx.Response:
        request_payloads.append(request)
        return httpx.Response(
            200,
            json={
                "choices": [{"message": {"content": '{"topics": []}'}}],
                "usage": {"prompt_tokens": 3, "completion_tokens": 4},
            },
        )

    transport = httpx.MockTransport(handler)
    original_client = httpx.Client
    monkeypatch.setattr(
        httpx,
        "Client",
        lambda **kwargs: original_client(transport=transport, **kwargs),
    )

    result = OpenAIClient(make_settings()).generate_json(
        system_prompt="system",
        user_prompt="user",
    )

    assert result.text == '{"topics": []}'
    assert result.model == "test-model"
    assert result.usage.input_tokens == 3
    assert result.usage.output_tokens == 4
    assert request_payloads[0].headers["authorization"] == "Bearer test-key"


def test_generate_json_requires_configuration() -> None:
    settings = Settings(ai_discovery_enabled=False)

    try:
        OpenAIClient(settings).generate_json(system_prompt="system", user_prompt="user")
    except OpenAIClientNotConfiguredError as exc:
        assert exc.error_code == "AI_NOT_CONFIGURED"


def test_generate_json_maps_http_errors(monkeypatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        _ = request
        return httpx.Response(500, json={"error": "failed"})

    transport = httpx.MockTransport(handler)
    original_client = httpx.Client
    monkeypatch.setattr(
        httpx,
        "Client",
        lambda **kwargs: original_client(transport=transport, **kwargs),
    )

    try:
        OpenAIClient(make_settings()).generate_json(system_prompt="system", user_prompt="user")
    except OpenAIClientError as exc:
        assert exc.error_code == "AI_PROVIDER_UNAVAILABLE"


def test_generate_json_rejects_malformed_provider_envelope(monkeypatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        _ = request
        return httpx.Response(200, json={"choices": []})

    transport = httpx.MockTransport(handler)
    original_client = httpx.Client
    monkeypatch.setattr(
        httpx,
        "Client",
        lambda **kwargs: original_client(transport=transport, **kwargs),
    )

    try:
        OpenAIClient(make_settings()).generate_json(system_prompt="system", user_prompt="user")
    except OpenAIClientInvalidResponseError as exc:
        assert exc.error_code == "AI_INVALID_RESPONSE"
