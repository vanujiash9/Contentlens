from datetime import datetime, timezone
from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1.topics import get_topic_service
from app.api.v1.workspaces import get_workspace_service
from app.core.security import AuthenticatedUser
from app.main import app
from app.schemas.topics import TopicListResponse, TopicSummary
from app.schemas.workspaces import CurrentUserResponse, WorkspaceSummary

USER_ID = UUID("00000000-0000-0000-0000-000000000001")
WORKSPACE_ID = UUID("10000000-0000-0000-0000-000000000001")
TOPIC_ID = UUID("20000000-0000-0000-0000-000000000001")
NOW = datetime(2026, 9, 16, tzinfo=timezone.utc)


class StubWorkspaceService:
    def get_current_user(self, current_user: AuthenticatedUser) -> CurrentUserResponse:
        return CurrentUserResponse(
            user_id=UUID(current_user.user_id),
            email=current_user.email,
            workspaces=[
                WorkspaceSummary(
                    id=WORKSPACE_ID,
                    name="Piano Growth Studio",
                    slug="piano-growth-studio",
                    role="owner",
                )
            ],
        )


class StubTopicService:
    def __init__(self) -> None:
        self.created_titles: list[str] = []

    def list_topics(self, workspace_id: UUID, current_user_id: str) -> TopicListResponse:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        return TopicListResponse(topics=[make_topic("Yamaha U3")])

    def create_topics(
        self,
        workspace_id: UUID,
        current_user_id: str,
        titles: list[str],
    ) -> list[TopicSummary]:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        self.created_titles = titles
        return [make_topic(title.strip()) for title in titles]


def make_topic(title: str) -> TopicSummary:
    return TopicSummary(
        id=TOPIC_ID,
        title=title,
        status="pending",
        source="user",
        opportunity_score=None,
        priority=None,
        research_progress=0,
        current_step=None,
        created_at=NOW,
        updated_at=NOW,
        completed_at=None,
        version=1,
    )


def override_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=str(USER_ID), email="owner@example.com")


def test_get_me_returns_workspace_memberships() -> None:
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_workspace_service] = StubWorkspaceService
    client = TestClient(app)

    response = client.get("/api/v1/me")

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"] == {
        "user_id": str(USER_ID),
        "email": "owner@example.com",
        "workspaces": [
            {
                "id": str(WORKSPACE_ID),
                "name": "Piano Growth Studio",
                "slug": "piano-growth-studio",
                "role": "owner",
            }
        ],
    }


def test_list_topics_returns_workspace_topics() -> None:
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_topic_service] = StubTopicService
    client = TestClient(app)

    response = client.get(f"/api/v1/workspaces/{WORKSPACE_ID}/topics")

    app.dependency_overrides.clear()
    assert response.status_code == 200
    topics = response.json()["data"]["topics"]
    assert topics[0]["title"] == "Yamaha U3"
    assert topics[0]["status"] == "pending"


def test_batch_create_topics_returns_created_topics() -> None:
    topic_service = StubTopicService()
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_topic_service] = lambda: topic_service
    client = TestClient(app)

    response = client.post(
        f"/api/v1/workspaces/{WORKSPACE_ID}/topics:batch",
        json={"titles": [" Yamaha U3 "]},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert topic_service.created_titles == [" Yamaha U3 "]
    assert response.json()["data"][0]["title"] == "Yamaha U3"
