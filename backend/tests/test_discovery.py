from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.ai.topic_discovery import (
    DiscoveryProviderResult,
    DiscoveryUsage,
    TopicDiscoveryError,
)
from app.api.dependencies import get_current_user, get_discovery_service
from app.core.security import AuthenticatedUser
from app.main import app
from app.schemas.discovery import (
    CreateDiscoveryRunRequest,
    DiscoveredTopicSummary,
    DiscoveryGeneration,
    DiscoveryRunSummary,
    GeneratedDiscoveredTopic,
    SignalDetail,
)
from app.schemas.topics import TopicSummary

USER_ID = UUID("00000000-0000-0000-0000-000000000001")
WORKSPACE_ID = UUID("10000000-0000-0000-0000-000000000001")
RUN_ID = UUID("30000000-0000-0000-0000-000000000001")
DISCOVERED_TOPIC_ID = UUID("40000000-0000-0000-0000-000000000001")
TOPIC_ID = UUID("20000000-0000-0000-0000-000000000001")
NOW = datetime(2026, 9, 16, tzinfo=timezone.utc)


class StubDiscoveryService:
    def __init__(self) -> None:
        self.created_request: CreateDiscoveryRunRequest | None = None

    def create_discovery_run(
        self,
        workspace_id: UUID,
        current_user_id: str,
        request: CreateDiscoveryRunRequest,
    ) -> DiscoveryRunSummary:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        self.created_request = request
        return make_run([make_discovered_topic()])

    def get_discovery_run(
        self,
        workspace_id: UUID,
        current_user_id: str,
        run_id: UUID,
    ) -> DiscoveryRunSummary:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        assert run_id == RUN_ID
        return make_run([make_discovered_topic()])

    def add_discovered_topic_to_queue(
        self,
        workspace_id: UUID,
        current_user_id: str,
        discovered_topic_id: UUID,
    ) -> TopicSummary:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        assert discovered_topic_id == DISCOVERED_TOPIC_ID
        return make_topic()


class FakeWorkspaceRepository:
    def __init__(self, is_member: bool) -> None:
        self.is_member = is_member

    def is_workspace_member(self, user_id: UUID, workspace_id: UUID) -> bool:
        _ = (user_id, workspace_id)
        return self.is_member


class FakeDiscoveryRepository:
    def __init__(self) -> None:
        self.created_run = False
        self.failed_run = False
        self.inserted_topics: list[GeneratedDiscoveredTopic] = []

    def create_run(
        self,
        workspace_id: UUID,
        user_id: UUID,
        industry: str,
        market: str,
        period_days: int,
        result_count: int,
    ) -> dict:
        _ = (workspace_id, user_id, industry, market, period_days, result_count)
        self.created_run = True
        return make_run_row(status="processing")

    def insert_topics(
        self,
        workspace_id: UUID,
        run_id: UUID,
        topics: list[GeneratedDiscoveredTopic],
    ) -> list[dict]:
        _ = (workspace_id, run_id)
        self.inserted_topics = topics
        return [make_discovered_topic_row()]

    def mark_run_completed(
        self,
        workspace_id: UUID,
        run_id: UUID,
        provider: str,
        model: str,
        input_tokens: int | None,
        output_tokens: int | None,
        latency_ms: int,
    ) -> dict:
        _ = (workspace_id, run_id, provider, model, input_tokens, output_tokens, latency_ms)
        return make_run_row(status="completed")

    def mark_run_failed(
        self,
        workspace_id: UUID,
        run_id: UUID,
        error_code: str,
        error_message: str,
    ) -> dict:
        _ = (workspace_id, run_id, error_code, error_message)
        self.failed_run = True
        return make_run_row(status="failed")


class FakeTopicRepository:
    pass


class FakeGenerator:
    def __init__(self, should_fail: bool = False) -> None:
        self.was_called = False
        self.should_fail = should_fail

    def generate(self, request):
        self.was_called = True
        if self.should_fail:
            raise TopicDiscoveryError
        return DiscoveryProviderResult(
            generation=DiscoveryGeneration(topics=[make_generated_topic()]),
            provider="test",
            model="test-model",
            usage=DiscoveryUsage(input_tokens=1, output_tokens=2),
        )


def override_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=str(USER_ID), email="owner@example.com")


def make_signal() -> SignalDetail:
    return SignalDetail(
        score=80,
        level="high",
        source="AI estimate",
        evidence="Strong internal fit.",
    )


def make_generated_topic() -> GeneratedDiscoveredTopic:
    return GeneratedDiscoveredTopic(
        title="Yamaha U3 buyer guide",
        opportunity_score=86,
        priority="high",
        search_signals=make_signal(),
        content_gap=make_signal(),
        business_relevance=make_signal(),
        angle="Practical buying checklist",
        reasoning="Useful for high-intent piano shoppers.",
    )


def make_discovered_topic() -> DiscoveredTopicSummary:
    return DiscoveredTopicSummary(
        id=DISCOVERED_TOPIC_ID,
        title="Yamaha U3 buyer guide",
        opportunity_score=86,
        priority="high",
        search_signals=make_signal(),
        content_gap=make_signal(),
        business_relevance=make_signal(),
        angle="Practical buying checklist",
        reasoning="Useful for high-intent piano shoppers.",
        added_to_queue_at=None,
        topic_id=None,
        created_at=NOW,
    )


def make_run(topics: list[DiscoveredTopicSummary]) -> DiscoveryRunSummary:
    return DiscoveryRunSummary(
        id=RUN_ID,
        workspace_id=WORKSPACE_ID,
        status="completed",
        industry="Piano & nhạc cụ phím",
        market="Việt Nam",
        period_days=30,
        result_count=5,
        created_at=NOW,
        completed_at=NOW,
        topics=topics,
    )


def make_run_row(status: str) -> dict:
    return {
        "id": str(RUN_ID),
        "workspace_id": str(WORKSPACE_ID),
        "status": status,
        "industry": "Piano & nhạc cụ phím",
        "market": "Việt Nam",
        "period": "30",
        "result_count": 5,
        "error_code": None,
        "error_message": None,
        "created_at": NOW,
        "completed_at": NOW if status == "completed" else None,
    }


def make_discovered_topic_row() -> dict:
    return {
        "id": str(DISCOVERED_TOPIC_ID),
        "title": "Yamaha U3 buyer guide",
        "opportunity_score": 86,
        "priority": "high",
        "search_signals": make_signal().model_dump(),
        "content_gap": make_signal().model_dump(),
        "business_relevance": make_signal().model_dump(),
        "angle": "Practical buying checklist",
        "reasoning": "Useful for high-intent piano shoppers.",
        "added_to_queue_at": None,
        "topic_id": None,
        "created_at": NOW,
    }


def make_topic() -> TopicSummary:
    return TopicSummary(
        id=TOPIC_ID,
        title="Yamaha U3 buyer guide",
        status="pending",
        source="ai",
        opportunity_score=86,
        priority="high",
        research_progress=0,
        current_step=None,
        created_at=NOW,
        updated_at=NOW,
        completed_at=None,
        version=1,
    )


def test_create_discovery_run_returns_generated_topics() -> None:
    discovery_service = StubDiscoveryService()
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_discovery_service] = lambda: discovery_service
    client = TestClient(app)

    response = client.post(
        f"/api/v1/workspaces/{WORKSPACE_ID}/discovery-runs",
        json={
            "industry": " Piano & nhạc cụ phím ",
            "market": " Việt Nam ",
            "period_days": 30,
            "result_count": 5,
        },
    )

    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert discovery_service.created_request is not None
    assert discovery_service.created_request.industry == "Piano & nhạc cụ phím"
    data = response.json()["data"]
    assert data["topics"][0]["title"] == "Yamaha U3 buyer guide"
    assert data["topics"][0]["search_signals"]["source"] == "AI estimate"


def test_create_discovery_run_rejects_invalid_count() -> None:
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_discovery_service] = StubDiscoveryService
    client = TestClient(app)

    response = client.post(
        f"/api/v1/workspaces/{WORKSPACE_ID}/discovery-runs",
        json={"industry": "Piano", "market": "Việt Nam", "period_days": 30, "result_count": 50},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 422


def test_get_discovery_run_returns_topics() -> None:
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_discovery_service] = StubDiscoveryService
    client = TestClient(app)

    response = client.get(f"/api/v1/workspaces/{WORKSPACE_ID}/discovery-runs/{RUN_ID}")

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["id"] == str(RUN_ID)


def test_add_discovered_topic_to_queue_returns_topic() -> None:
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_discovery_service] = StubDiscoveryService
    client = TestClient(app)

    response = client.post(
        f"/api/v1/workspaces/{WORKSPACE_ID}/discovered-topics/{DISCOVERED_TOPIC_ID}:add-to-queue"
    )

    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert response.json()["data"]["topic"]["source"] == "ai"


def test_service_checks_membership_before_calling_ai() -> None:
    from app.services.discovery import DiscoveryService

    generator = FakeGenerator()
    service = DiscoveryService(
        discovery_repository=FakeDiscoveryRepository(),
        topic_repository=FakeTopicRepository(),
        workspace_repository=FakeWorkspaceRepository(is_member=False),
        generator=generator,
    )

    try:
        service.create_discovery_run(
            workspace_id=WORKSPACE_ID,
            current_user_id=str(USER_ID),
            request=CreateDiscoveryRunRequest(
                industry="Piano", market="Việt Nam", period_days=30, result_count=5
            ),
        )
    except HTTPException as exc:
        assert exc.status_code == 404

    assert generator.was_called is False


def test_service_marks_run_failed_when_ai_provider_fails() -> None:
    from app.services.discovery import DiscoveryService

    repository = FakeDiscoveryRepository()
    service = DiscoveryService(
        discovery_repository=repository,
        topic_repository=FakeTopicRepository(),
        workspace_repository=FakeWorkspaceRepository(is_member=True),
        generator=FakeGenerator(should_fail=True),
    )

    try:
        service.create_discovery_run(
            workspace_id=WORKSPACE_ID,
            current_user_id=str(USER_ID),
            request=CreateDiscoveryRunRequest(
                industry="Piano", market="Việt Nam", period_days=30, result_count=5
            ),
        )
    except HTTPException as exc:
        assert exc.status_code == 503

    assert repository.created_run is True
    assert repository.failed_run is True
    assert repository.inserted_topics == []
