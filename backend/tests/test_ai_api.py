from fastapi.testclient import TestClient

from app.ai.router import TopicDiscoveryInput
from app.api.dependencies import get_ai_router
from app.main import app
from app.schemas.ai import AIProviderMetadata, TopicDiscoveryAIResponse
from app.schemas.discovery import DiscoveryGeneration
from tests.test_discovery import make_generated_topic


class StubAIRouter:
    def __init__(self) -> None:
        self.request: TopicDiscoveryInput | None = None

    def run_topic_discovery(self, request: TopicDiscoveryInput) -> TopicDiscoveryAIResponse:
        self.request = request
        return TopicDiscoveryAIResponse(
            generation=DiscoveryGeneration(topics=[make_generated_topic()]),
            metadata=AIProviderMetadata(
                provider="test-provider",
                model="test-model",
                input_tokens=1,
                output_tokens=2,
                prompt_version="topic_discovery_v1",
            ),
        )


def test_ai_topic_discovery_route_is_swagger_testable() -> None:
    ai_router = StubAIRouter()
    app.dependency_overrides[get_ai_router] = lambda: ai_router
    client = TestClient(app)

    response = client.post(
        "/api/v1/ai/topic-discovery:test",
        json={
            "industry": " Piano & nhạc cụ phím ",
            "market": " Việt Nam ",
            "period_days": 30,
            "result_count": 5,
        },
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert ai_router.request is not None
    assert ai_router.request.industry == "Piano & nhạc cụ phím"
    data = response.json()["data"]
    assert data["generation"]["topics"][0]["title"] == "Yamaha U3 buyer guide"
    assert data["metadata"]["provider"] == "test-provider"


def test_ai_topic_discovery_route_appears_in_openapi() -> None:
    client = TestClient(app)

    response = client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/ai/topic-discovery:test" in paths
