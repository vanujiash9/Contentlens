from uuid import UUID

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.dependencies import get_agent_service, get_current_user
from app.core.security import AuthenticatedUser
from app.main import app
from app.schemas.agent import (
    CreateDiscoveryRunAgentAction,
    GenerateBriefAgentAction,
)
from app.schemas.briefs import GenerateContentBriefRequest
from app.schemas.discovery import CreateDiscoveryRunRequest
from app.services.agent import ContentLensAgentService
from tests.test_briefs import make_brief_summary, make_request as make_brief_request
from tests.test_discovery import make_discovered_topic, make_run

USER_ID = UUID("00000000-0000-0000-0000-000000000001")
WORKSPACE_ID = UUID("10000000-0000-0000-0000-000000000001")
TOPIC_ID = UUID("20000000-0000-0000-0000-000000000001")


class StubAgentService:
    def __init__(self) -> None:
        self.workspace_id: UUID | None = None
        self.current_user_id: str | None = None
        self.action = None

    def run_action(self, workspace_id: UUID, current_user_id: str, request):
        self.workspace_id = workspace_id
        self.current_user_id = current_user_id
        self.action = request
        if isinstance(request, CreateDiscoveryRunAgentAction):
            return {"action": "create_discovery_run", "result": make_run([make_discovered_topic()])}
        return {"action": "generate_brief", "result": make_brief_summary()}


class StubDiscoveryService:
    def __init__(self, should_fail: bool = False) -> None:
        self.was_called = False
        self.should_fail = should_fail

    def create_discovery_run(
        self,
        workspace_id: UUID,
        current_user_id: str,
        request: CreateDiscoveryRunRequest,
    ):
        _ = (workspace_id, current_user_id, request)
        self.was_called = True
        if self.should_fail:
            raise HTTPException(status_code=404, detail="Workspace not found")
        return make_run([make_discovered_topic()])


class StubBriefService:
    def __init__(self) -> None:
        self.was_called = False

    def generate_brief(
        self,
        workspace_id: UUID,
        current_user_id: str,
        request: GenerateContentBriefRequest,
    ):
        _ = (workspace_id, current_user_id, request)
        self.was_called = True
        return make_brief_summary()


def override_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=str(USER_ID), email="owner@example.com")


def make_discovery_payload() -> dict:
    return {
        "action": "create_discovery_run",
        "input": {
            "industry": " Piano & nhạc cụ phím ",
            "market": " Việt Nam ",
            "period_days": 30,
            "result_count": 5,
        },
    }


def make_brief_payload() -> dict:
    return {
        "action": "generate_brief",
        "input": make_brief_request().model_dump(mode="json"),
    }


def test_agent_route_dispatches_discovery_action() -> None:
    agent_service = StubAgentService()
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_agent_service] = lambda: agent_service
    client = TestClient(app)

    response = client.post(
        f"/api/v1/workspaces/{WORKSPACE_ID}/agent/actions",
        json=make_discovery_payload(),
    )

    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert agent_service.workspace_id == WORKSPACE_ID
    assert agent_service.current_user_id == str(USER_ID)
    assert isinstance(agent_service.action, CreateDiscoveryRunAgentAction)
    data = response.json()["data"]
    assert data["action"] == "create_discovery_run"
    assert data["result"]["topics"][0]["title"] == "Yamaha U3 buyer guide"


def test_agent_route_dispatches_brief_action() -> None:
    agent_service = StubAgentService()
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_agent_service] = lambda: agent_service
    client = TestClient(app)

    response = client.post(
        f"/api/v1/workspaces/{WORKSPACE_ID}/agent/actions",
        json=make_brief_payload(),
    )

    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert isinstance(agent_service.action, GenerateBriefAgentAction)
    data = response.json()["data"]
    assert data["action"] == "generate_brief"
    assert data["result"]["topic_id"] == str(TOPIC_ID)


def test_agent_route_rejects_unknown_action() -> None:
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_agent_service] = StubAgentService
    client = TestClient(app)

    response = client.post(
        f"/api/v1/workspaces/{WORKSPACE_ID}/agent/actions",
        json={"action": "unknown", "input": {}},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 422


def test_agent_route_rejects_wrong_payload_shape() -> None:
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_agent_service] = StubAgentService
    client = TestClient(app)

    response = client.post(
        f"/api/v1/workspaces/{WORKSPACE_ID}/agent/actions",
        json={"action": "generate_brief", "input": {"industry": "Piano"}},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 422


def test_agent_route_appears_in_openapi() -> None:
    client = TestClient(app)

    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "/api/v1/workspaces/{workspace_id}/agent/actions" in response.json()["paths"]


def test_agent_service_calls_only_discovery_for_discovery_action() -> None:
    discovery_service = StubDiscoveryService()
    brief_service = StubBriefService()
    service = ContentLensAgentService(discovery_service, brief_service)

    result = service.run_action(
        WORKSPACE_ID,
        str(USER_ID),
        CreateDiscoveryRunAgentAction(
            action="create_discovery_run",
            input=CreateDiscoveryRunRequest(
                industry="Piano",
                market="Việt Nam",
                period_days=30,
                result_count=5,
            ),
        ),
    )

    assert discovery_service.was_called is True
    assert brief_service.was_called is False
    assert result.action == "create_discovery_run"


def test_agent_service_calls_only_brief_for_brief_action() -> None:
    discovery_service = StubDiscoveryService()
    brief_service = StubBriefService()
    service = ContentLensAgentService(discovery_service, brief_service)

    result = service.run_action(
        WORKSPACE_ID,
        str(USER_ID),
        GenerateBriefAgentAction(action="generate_brief", input=make_brief_request()),
    )

    assert discovery_service.was_called is False
    assert brief_service.was_called is True
    assert result.action == "generate_brief"


def test_agent_service_preserves_downstream_http_errors() -> None:
    service = ContentLensAgentService(StubDiscoveryService(should_fail=True), StubBriefService())

    try:
        service.run_action(
            WORKSPACE_ID,
            str(USER_ID),
            CreateDiscoveryRunAgentAction(
                action="create_discovery_run",
                input=CreateDiscoveryRunRequest(
                    industry="Piano",
                    market="Việt Nam",
                    period_days=30,
                    result_count=5,
                ),
            ),
        )
    except HTTPException as exc:
        assert exc.status_code == 404
