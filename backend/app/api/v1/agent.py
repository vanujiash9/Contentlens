from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_agent_service, get_current_user
from app.core.security import AuthenticatedUser
from app.schemas.agent import AgentActionRequest, AgentActionResponse
from app.schemas.common import ApiResponse
from app.services.agent import ContentLensAgentService

router = APIRouter(prefix="/workspaces/{workspace_id}/agent", tags=["agent"])


@router.post(
    "/actions",
    response_model=ApiResponse[AgentActionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def run_agent_action(
    workspace_id: UUID,
    request: AgentActionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    agent_service: ContentLensAgentService = Depends(get_agent_service),
) -> ApiResponse[AgentActionResponse]:
    return ApiResponse(
        data=agent_service.run_action(workspace_id, current_user.user_id, request)
    )
