import httpx
import pytest
from pydantic import SecretStr

from app.core.config import Settings
from app.integrations.openai_client import (
    OpenAIClient,
    OpenAIClientError,
    OpenAIClientInvalidResponseError,
    OpenAIClientNotConfiguredError,
)
from app.schemas.discovery import DiscoveryGeneration
from tests.test_ai_router import make_generation_json


def make_settings() -> Settings:
    return Settings(
        OPENAI__API_KEY=SecretStr("test-key"),
        OPENAI__BASE_URL="https://api.example.test/v1",
        OPENAI__MODEL="test-model",
        OPENAI__TIMEOUT_SECONDS=5,
        OPENAI__MAX_RETRIES=0,
        OPENAI__MAX_OUTPUT_TOKENS=100,
    )


def test_generate_structured_returns_output_and_usage(monkeypatch) -> None:
    request_payloads = []

    def handler(request: httpx.Request) -> httpx.Response:
        request_payloads.append(request)
        return httpx.Response(
            200,
            json={
                "choices": [{"message": {"content": make_generation_json()}}],
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

    result = OpenAIClient(make_settings()).generate_structured(
        system_prompt="system",
        user_prompt="user",
        output_model=DiscoveryGeneration,
    )

    payload = request_payloads[0].read().decode()
    assert result.output.topics[0].title == "Yamaha U3 buyer guide"
    assert result.model == "test-model"
    assert result.usage.input_tokens == 3
    assert result.usage.output_tokens == 4
    assert request_payloads[0].headers["authorization"] == "Bearer test-key"
    assert '"type": "json_schema"' in payload
    assert '"name": "DiscoveryGeneration"' in payload


def test_generate_structured_requires_configuration() -> None:
    settings = Settings(ai_discovery_enabled=False)

    with pytest.raises(OpenAIClientNotConfiguredError) as exc_info:
        OpenAIClient(settings).generate_structured(
            system_prompt="system",
            user_prompt="user",
            output_model=DiscoveryGeneration,
        )

    assert exc_info.value.error_code == "AI_NOT_CONFIGURED"


def test_generate_structured_maps_http_errors(monkeypatch) -> None:
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

    with pytest.raises(OpenAIClientError) as exc_info:
        OpenAIClient(make_settings()).generate_structured(
            system_prompt="system",
            user_prompt="user",
            output_model=DiscoveryGeneration,
        )

    assert exc_info.value.error_code == "AI_PROVIDER_UNAVAILABLE"


def test_generate_structured_rejects_malformed_provider_envelope(monkeypatch) -> None:
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

    with pytest.raises(OpenAIClientInvalidResponseError) as exc_info:
        OpenAIClient(make_settings()).generate_structured(
            system_prompt="system",
            user_prompt="user",
            output_model=DiscoveryGeneration,
        )

    assert exc_info.value.error_code == "AI_INVALID_RESPONSE"


def test_generate_structured_rejects_schema_invalid_output(monkeypatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        _ = request
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": '{"topics": [{"title": "missing"}]}'}}]},
        )

    transport = httpx.MockTransport(handler)
    original_client = httpx.Client
    monkeypatch.setattr(
        httpx,
        "Client",
        lambda **kwargs: original_client(transport=transport, **kwargs),
    )

    with pytest.raises(OpenAIClientInvalidResponseError) as exc_info:
        OpenAIClient(make_settings()).generate_structured(
            system_prompt="system",
            user_prompt="user",
            output_model=DiscoveryGeneration,
        )

    assert exc_info.value.error_code == "AI_INVALID_RESPONSE"
