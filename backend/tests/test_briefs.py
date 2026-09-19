from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.ai.provider import AIUsage
from app.api.dependencies import get_brief_service, get_current_user
from app.core.security import AuthenticatedUser
from app.main import app
from app.schemas.briefs import BriefListResponse, BriefSummary, GenerateContentBriefRequest
from app.services.briefs import BriefService
from app.workflows.content_brief import ContentBriefWorkflowResult
from app.workflows.core import WorkflowError
from tests.test_content_brief_workflow import make_brief_generation

USER_ID = UUID("00000000-0000-0000-0000-000000000001")
WORKSPACE_ID = UUID("10000000-0000-0000-0000-000000000001")
TOPIC_ID = UUID("20000000-0000-0000-0000-000000000001")
BRIEF_ID = UUID("50000000-0000-0000-0000-000000000001")
WORKFLOW_RUN_ID = UUID("60000000-0000-0000-0000-000000000001")
NOW = datetime(2026, 9, 19, tzinfo=timezone.utc)


class StubBriefService:
    def __init__(self) -> None:
        self.generated_request: GenerateContentBriefRequest | None = None

    def list_briefs(self, workspace_id: UUID, current_user_id: str) -> BriefListResponse:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        return BriefListResponse(briefs=[make_brief_summary()])

    def get_brief(self, workspace_id: UUID, current_user_id: str, brief_id: UUID) -> BriefSummary:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        assert brief_id == BRIEF_ID
        return make_brief_summary()

    def generate_brief(
        self,
        workspace_id: UUID,
        current_user_id: str,
        request: GenerateContentBriefRequest,
    ) -> BriefSummary:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        self.generated_request = request
        return make_brief_summary()


class FakeWorkspaceRepository:
    def __init__(self, is_member: bool) -> None:
        self.is_member = is_member

    def is_workspace_member(self, user_id: UUID, workspace_id: UUID) -> bool:
        _ = (user_id, workspace_id)
        return self.is_member


class FakeTopicRepository:
    def __init__(self, topic: dict | None) -> None:
        self.topic = topic

    def get_by_id(self, workspace_id: UUID, topic_id: UUID) -> dict | None:
        _ = (workspace_id, topic_id)
        return self.topic


class FakeBriefRepository:
    def __init__(self) -> None:
        self.saved_generation = None

    def list_by_workspace(self, workspace_id: UUID) -> list[dict]:
        _ = workspace_id
        return [make_brief_row()]

    def get_by_id(self, workspace_id: UUID, brief_id: UUID) -> dict | None:
        _ = (workspace_id, brief_id)
        return make_brief_row()

    def upsert_generated_brief(self, **kwargs) -> dict:
        self.saved_generation = kwargs["generation"]
        return make_brief_row()


class FakeWorkflowRunRepository:
    def __init__(self) -> None:
        self.completed_run = False
        self.failed_run = False

    def create_run(self, **kwargs) -> dict:
        _ = kwargs
        return {"id": str(WORKFLOW_RUN_ID)}

    def mark_completed(self, **kwargs) -> dict:
        _ = kwargs
        self.completed_run = True
        return {"id": str(WORKFLOW_RUN_ID)}

    def mark_failed(self, **kwargs) -> dict:
        _ = kwargs
        self.failed_run = True
        return {"id": str(WORKFLOW_RUN_ID)}


class FakeWorkflow:
    def __init__(self, should_fail: bool = False) -> None:
        self.was_called = False
        self.should_fail = should_fail

    def run(self, **kwargs) -> ContentBriefWorkflowResult:
        self.was_called = True
        if self.should_fail:
            raise WorkflowError("generate_brief", RuntimeError("boom"))
        return ContentBriefWorkflowResult(
            generation=make_brief_generation(),
            provider="test",
            model="test-model",
            usage=AIUsage(input_tokens=1, output_tokens=2),
        )


def override_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=str(USER_ID), email="owner@example.com")


def make_brief_summary() -> BriefSummary:
    return BriefSummary.model_validate(make_brief_row())


def make_brief_row() -> dict:
    return {
        "id": str(BRIEF_ID),
        "workspace_id": str(WORKSPACE_ID),
        "topic_id": str(TOPIC_ID),
        "title": "Hướng dẫn mua Yamaha U3",
        "search_intent": "Mua Yamaha U3 cũ",
        "target_audience": "Người mua piano gia đình",
        "objective": "Tăng lead tư vấn",
        "angle": "Checklist mua đàn",
        "key_questions": ["Có nên mua Yamaha U3 cũ?"],
        "outline": [{"heading": "Kiểm tra đàn"}],
        "key_facts": ["Kiểm tra serial."],
        "must_cover": ["Checklist kiểm tra."],
        "must_avoid": ["Không bịa giá."],
        "evidence_map": [{"claim": "Kiểm tra serial"}],
        "review_status": "draft",
        "quality_checks": ["Có outline."],
        "quality_warnings": [],
        "created_at": NOW,
        "updated_at": NOW,
        "version": 1,
    }


def make_request() -> GenerateContentBriefRequest:
    return GenerateContentBriefRequest(
        topic_id=TOPIC_ID,
        industry="Piano & nhạc cụ phím",
        market="Việt Nam",
        audience="Người mua piano gia đình",
        search_intent="Mua Yamaha U3 cũ",
        angle="Checklist mua đàn",
        business_goal="Tăng lead tư vấn",
        research_insights="Người mua lo về chất lượng đàn cũ.",
    )


def test_generate_brief_route_returns_brief() -> None:
    brief_service = StubBriefService()
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_brief_service] = lambda: brief_service
    client = TestClient(app)

    response = client.post(
        f"/api/v1/workspaces/{WORKSPACE_ID}/briefs:generate",
        json=make_request().model_dump(mode="json"),
    )

    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert brief_service.generated_request is not None
    assert response.json()["data"]["title"] == "Hướng dẫn mua Yamaha U3"


def test_list_briefs_route_returns_briefs() -> None:
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_brief_service] = StubBriefService
    client = TestClient(app)

    response = client.get(f"/api/v1/workspaces/{WORKSPACE_ID}/briefs")

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["briefs"][0]["id"] == str(BRIEF_ID)


def test_brief_service_checks_membership_before_workflow() -> None:
    workflow = FakeWorkflow()
    service = BriefService(
        brief_repository=FakeBriefRepository(),
        topic_repository=FakeTopicRepository(make_topic_row()),
        workspace_repository=FakeWorkspaceRepository(is_member=False),
        workflow_run_repository=FakeWorkflowRunRepository(),
        workflow=workflow,
    )

    try:
        service.generate_brief(WORKSPACE_ID, str(USER_ID), make_request())
    except HTTPException as exc:
        assert exc.status_code == 404

    assert workflow.was_called is False


def test_brief_service_generates_and_persists_brief() -> None:
    brief_repository = FakeBriefRepository()
    workflow_runs = FakeWorkflowRunRepository()
    service = BriefService(
        brief_repository=brief_repository,
        topic_repository=FakeTopicRepository(make_topic_row()),
        workspace_repository=FakeWorkspaceRepository(is_member=True),
        workflow_run_repository=workflow_runs,
        workflow=FakeWorkflow(),
    )

    result = service.generate_brief(WORKSPACE_ID, str(USER_ID), make_request())

    assert result.title == "Hướng dẫn mua Yamaha U3"
    assert brief_repository.saved_generation is not None
    assert workflow_runs.completed_run is True


def test_brief_service_marks_workflow_failed_when_ai_fails() -> None:
    workflow_runs = FakeWorkflowRunRepository()
    service = BriefService(
        brief_repository=FakeBriefRepository(),
        topic_repository=FakeTopicRepository(make_topic_row()),
        workspace_repository=FakeWorkspaceRepository(is_member=True),
        workflow_run_repository=workflow_runs,
        workflow=FakeWorkflow(should_fail=True),
    )

    try:
        service.generate_brief(WORKSPACE_ID, str(USER_ID), make_request())
    except HTTPException as exc:
        assert exc.status_code == 503

    assert workflow_runs.failed_run is True


def make_topic_row() -> dict:
    return {
        "id": str(TOPIC_ID),
        "title": "Yamaha U3 buyer guide",
        "status": "pending",
        "source": "ai",
        "opportunity_score": 86,
        "priority": "high",
        "research_progress": 0,
        "current_step": None,
        "created_at": NOW,
        "updated_at": NOW,
        "completed_at": None,
        "version": 1,
    }
