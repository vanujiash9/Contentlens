from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.ai.provider import AIUsage
from app.api.dependencies import get_brief_service, get_current_user
from app.core.security import AuthenticatedUser
from app.main import app
from app.schemas.briefs import (
    BriefListResponse,
    BriefSummary,
    GenerateContentBriefRequest,
    RequestBriefRevisionRequest,
    SaveBriefDraftRequest,
)
from app.services.briefs import BriefService
from app.workflows.brief_revision import BriefRevisionWorkflowResult
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
        self.saved_draft_request: SaveBriefDraftRequest | None = None
        self.revision_request: RequestBriefRevisionRequest | None = None

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

    def save_draft(
        self,
        workspace_id: UUID,
        current_user_id: str,
        brief_id: UUID,
        request: SaveBriefDraftRequest,
    ) -> BriefSummary:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        assert brief_id == BRIEF_ID
        self.saved_draft_request = request
        return make_brief_summary({"draft": request.draft, "version": 2})

    def approve_brief(
        self,
        workspace_id: UUID,
        current_user_id: str,
        brief_id: UUID,
    ) -> BriefSummary:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        assert brief_id == BRIEF_ID
        return make_brief_summary({"review_status": "approved", "approved_at": NOW})

    def request_revision(
        self,
        workspace_id: UUID,
        current_user_id: str,
        brief_id: UUID,
        request: RequestBriefRevisionRequest,
    ) -> BriefSummary:
        assert workspace_id == WORKSPACE_ID
        assert current_user_id == str(USER_ID)
        assert brief_id == BRIEF_ID
        self.revision_request = request
        return make_brief_summary({"draft": "Bản nháp đã sửa", "version": 2})


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
        self.saved_draft: str | None = None
        self.revision_created = False
        self.revision_completed = False
        self.revision_failed = False

    def list_by_workspace(self, workspace_id: UUID) -> list[dict]:
        _ = workspace_id
        return [make_brief_row()]

    def get_by_id(self, workspace_id: UUID, brief_id: UUID) -> dict | None:
        _ = (workspace_id, brief_id)
        return make_brief_row()

    def upsert_generated_brief(self, **kwargs) -> dict:
        self.saved_generation = kwargs["generation"]
        return make_brief_row({"draft": kwargs["generation"].draft})

    def update_draft(self, **kwargs) -> dict:
        self.saved_draft = kwargs["draft"]
        return make_brief_row({"draft": kwargs["draft"], "version": 2})

    def approve(self, **kwargs) -> dict:
        _ = kwargs
        return make_brief_row({"review_status": "approved", "approved_at": NOW})

    def create_revision_request(self, **kwargs) -> dict:
        _ = kwargs
        self.revision_created = True
        return {"id": "70000000-0000-0000-0000-000000000001"}

    def mark_revision_completed(self, **kwargs) -> dict:
        _ = kwargs
        self.revision_completed = True
        return {"id": "70000000-0000-0000-0000-000000000001"}

    def mark_revision_failed(self, **kwargs) -> dict:
        _ = kwargs
        self.revision_failed = True
        return {"id": "70000000-0000-0000-0000-000000000001"}


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


class FakeRevisionWorkflow:
    def __init__(self, should_fail: bool = False) -> None:
        self.was_called = False
        self.should_fail = should_fail

    def run(self, **kwargs) -> BriefRevisionWorkflowResult:
        self.was_called = True
        if self.should_fail:
            raise WorkflowError("revise_brief", RuntimeError("boom"))
        return BriefRevisionWorkflowResult(
            generation=make_brief_generation().model_copy(update={"draft": "Bản nháp đã sửa"}),
            provider="test",
            model="test-model",
            usage=AIUsage(input_tokens=1, output_tokens=2),
        )


def override_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=str(USER_ID), email="owner@example.com")


def make_brief_summary(overrides: dict | None = None) -> BriefSummary:
    return BriefSummary.model_validate(make_brief_row(overrides))


def make_brief_row(overrides: dict | None = None) -> dict:
    row = {
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
        "draft": "Bản nháp ban đầu",
        "must_cover": ["Checklist kiểm tra."],
        "must_avoid": ["Không bịa giá."],
        "evidence_map": [{"claim": "Kiểm tra serial"}],
        "review_status": "pending_review",
        "approved_at": None,
        "word_count": 1200,
        "sources_used": 3,
        "total_claims": 8,
        "cited_claims": 6,
        "quality_checks": ["Có outline."],
        "quality_warnings": [],
        "created_at": NOW,
        "updated_at": NOW,
        "version": 1,
    }
    return {**row, **(overrides or {})}


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
    data = response.json()["data"]["briefs"][0]
    assert data["id"] == str(BRIEF_ID)
    assert data["draft"] == "Bản nháp ban đầu"
    assert data["word_count"] == 1200


def test_save_draft_route_persists_draft() -> None:
    brief_service = StubBriefService()
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_brief_service] = lambda: brief_service
    client = TestClient(app)

    response = client.patch(
        f"/api/v1/workspaces/{WORKSPACE_ID}/briefs/{BRIEF_ID}/draft",
        json={"draft": "Bản nháp mới", "expected_version": 1},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert brief_service.saved_draft_request is not None
    assert brief_service.saved_draft_request.draft == "Bản nháp mới"
    assert response.json()["data"]["draft"] == "Bản nháp mới"


def test_approve_brief_route_returns_approved_state() -> None:
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_brief_service] = StubBriefService
    client = TestClient(app)

    response = client.post(f"/api/v1/workspaces/{WORKSPACE_ID}/briefs/{BRIEF_ID}:approve")

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["review_status"] == "approved"
    assert response.json()["data"]["approved_at"] is not None


def test_request_revision_route_returns_revised_brief() -> None:
    brief_service = StubBriefService()
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_brief_service] = lambda: brief_service
    client = TestClient(app)

    response = client.post(
        f"/api/v1/workspaces/{WORKSPACE_ID}/briefs/{BRIEF_ID}/revisions",
        json={"request": "Viết lại phần kết luận", "expected_version": 1},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert brief_service.revision_request is not None
    assert brief_service.revision_request.request == "Viết lại phần kết luận"
    assert response.json()["data"]["draft"] == "Bản nháp đã sửa"


def test_brief_service_checks_membership_before_workflow() -> None:
    workflow = FakeWorkflow()
    service = BriefService(
        brief_repository=FakeBriefRepository(),
        topic_repository=FakeTopicRepository(make_topic_row()),
        workspace_repository=FakeWorkspaceRepository(is_member=False),
        workflow_run_repository=FakeWorkflowRunRepository(),
        workflow=workflow,
        revision_workflow=FakeRevisionWorkflow(),
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
        revision_workflow=FakeRevisionWorkflow(),
    )

    result = service.generate_brief(WORKSPACE_ID, str(USER_ID), make_request())

    assert result.title == "Hướng dẫn mua Yamaha U3"
    assert brief_repository.saved_generation is not None
    assert workflow_runs.completed_run is True


def test_brief_service_saves_draft_with_expected_version() -> None:
    brief_repository = FakeBriefRepository()
    service = BriefService(
        brief_repository=brief_repository,
        topic_repository=FakeTopicRepository(make_topic_row()),
        workspace_repository=FakeWorkspaceRepository(is_member=True),
        workflow_run_repository=FakeWorkflowRunRepository(),
        workflow=FakeWorkflow(),
        revision_workflow=FakeRevisionWorkflow(),
    )

    result = service.save_draft(
        WORKSPACE_ID,
        str(USER_ID),
        BRIEF_ID,
        SaveBriefDraftRequest(draft="Bản nháp mới", expected_version=1),
    )

    assert brief_repository.saved_draft == "Bản nháp mới"
    assert result.draft == "Bản nháp mới"
    assert result.version == 2


def test_brief_service_rejects_stale_draft_version() -> None:
    service = BriefService(
        brief_repository=FakeBriefRepository(),
        topic_repository=FakeTopicRepository(make_topic_row()),
        workspace_repository=FakeWorkspaceRepository(is_member=True),
        workflow_run_repository=FakeWorkflowRunRepository(),
        workflow=FakeWorkflow(),
        revision_workflow=FakeRevisionWorkflow(),
    )

    try:
        service.save_draft(
            WORKSPACE_ID,
            str(USER_ID),
            BRIEF_ID,
            SaveBriefDraftRequest(draft="Bản nháp mới", expected_version=2),
        )
    except HTTPException as exc:
        assert exc.status_code == 409


def test_brief_service_requests_revision_and_persists_result() -> None:
    brief_repository = FakeBriefRepository()
    workflow_runs = FakeWorkflowRunRepository()
    revision_workflow = FakeRevisionWorkflow()
    service = BriefService(
        brief_repository=brief_repository,
        topic_repository=FakeTopicRepository(make_topic_row()),
        workspace_repository=FakeWorkspaceRepository(is_member=True),
        workflow_run_repository=workflow_runs,
        workflow=FakeWorkflow(),
        revision_workflow=revision_workflow,
    )

    result = service.request_revision(
        WORKSPACE_ID,
        str(USER_ID),
        BRIEF_ID,
        RequestBriefRevisionRequest(request="Viết lại kết luận", expected_version=1),
    )

    assert revision_workflow.was_called is True
    assert brief_repository.revision_created is True
    assert brief_repository.revision_completed is True
    assert brief_repository.saved_generation is not None
    assert workflow_runs.completed_run is True
    assert result.draft == "Bản nháp đã sửa"


def test_brief_service_marks_revision_failed_when_ai_fails() -> None:
    brief_repository = FakeBriefRepository()
    workflow_runs = FakeWorkflowRunRepository()
    service = BriefService(
        brief_repository=brief_repository,
        topic_repository=FakeTopicRepository(make_topic_row()),
        workspace_repository=FakeWorkspaceRepository(is_member=True),
        workflow_run_repository=workflow_runs,
        workflow=FakeWorkflow(),
        revision_workflow=FakeRevisionWorkflow(should_fail=True),
    )

    try:
        service.request_revision(
            WORKSPACE_ID,
            str(USER_ID),
            BRIEF_ID,
            RequestBriefRevisionRequest(request="Viết lại kết luận", expected_version=1),
        )
    except HTTPException as exc:
        assert exc.status_code == 503

    assert brief_repository.revision_failed is True
    assert workflow_runs.failed_run is True


def test_brief_service_marks_workflow_failed_when_ai_fails() -> None:
    workflow_runs = FakeWorkflowRunRepository()
    service = BriefService(
        brief_repository=FakeBriefRepository(),
        topic_repository=FakeTopicRepository(make_topic_row()),
        workspace_repository=FakeWorkspaceRepository(is_member=True),
        workflow_run_repository=workflow_runs,
        workflow=FakeWorkflow(should_fail=True),
        revision_workflow=FakeRevisionWorkflow(),
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
