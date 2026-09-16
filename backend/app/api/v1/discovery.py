from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_current_user, get_discovery_service
from app.core.security import AuthenticatedUser
from app.schemas.common import ApiResponse
from app.schemas.discovery import (
    AddDiscoveredTopicResponse,
    CreateDiscoveryRunRequest,
    DiscoveryRunSummary,
)
from app.services.discovery import DiscoveryService

router = APIRouter(prefix="/workspaces/{workspace_id}", tags=["discovery"])


@router.post(
    "/discovery-runs",
    response_model=ApiResponse[DiscoveryRunSummary],
    status_code=status.HTTP_201_CREATED,
)
async def create_discovery_run(
    workspace_id: UUID,
    request: CreateDiscoveryRunRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    discovery_service: DiscoveryService = Depends(get_discovery_service),
) -> ApiResponse[DiscoveryRunSummary]:
    return ApiResponse(
        data=discovery_service.create_discovery_run(workspace_id, current_user.user_id, request)
    )


@router.get("/discovery-runs/{run_id}", response_model=ApiResponse[DiscoveryRunSummary])
async def get_discovery_run(
    workspace_id: UUID,
    run_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    discovery_service: DiscoveryService = Depends(get_discovery_service),
) -> ApiResponse[DiscoveryRunSummary]:
    return ApiResponse(
        data=discovery_service.get_discovery_run(workspace_id, current_user.user_id, run_id)
    )


@router.post(
    "/discovered-topics/{discovered_topic_id}:add-to-queue",
    response_model=ApiResponse[AddDiscoveredTopicResponse],
    status_code=status.HTTP_201_CREATED,
)
async def add_discovered_topic_to_queue(
    workspace_id: UUID,
    discovered_topic_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    discovery_service: DiscoveryService = Depends(get_discovery_service),
) -> ApiResponse[AddDiscoveredTopicResponse]:
    topic = discovery_service.add_discovered_topic_to_queue(
        workspace_id=workspace_id,
        current_user_id=current_user.user_id,
        discovered_topic_id=discovered_topic_id,
    )
    return ApiResponse(data=AddDiscoveredTopicResponse(topic=topic))
