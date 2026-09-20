from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_brief_service, get_current_user
from app.core.security import AuthenticatedUser
from app.schemas.briefs import (
    BriefListResponse,
    BriefSummary,
    GenerateContentBriefRequest,
    RequestBriefRevisionRequest,
    SaveBriefDraftRequest,
)
from app.schemas.common import ApiResponse
from app.services.briefs import BriefService

router = APIRouter(prefix="/workspaces/{workspace_id}/briefs", tags=["briefs"])


@router.get("", response_model=ApiResponse[BriefListResponse])
async def list_briefs(
    workspace_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    brief_service: BriefService = Depends(get_brief_service),
) -> ApiResponse[BriefListResponse]:
    return ApiResponse(data=brief_service.list_briefs(workspace_id, current_user.user_id))


@router.post(
    ":generate",
    response_model=ApiResponse[BriefSummary],
    status_code=status.HTTP_201_CREATED,
)
async def generate_brief(
    workspace_id: UUID,
    request: GenerateContentBriefRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    brief_service: BriefService = Depends(get_brief_service),
) -> ApiResponse[BriefSummary]:
    return ApiResponse(
        data=brief_service.generate_brief(workspace_id, current_user.user_id, request)
    )


@router.get("/{brief_id}", response_model=ApiResponse[BriefSummary])
async def get_brief(
    workspace_id: UUID,
    brief_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    brief_service: BriefService = Depends(get_brief_service),
) -> ApiResponse[BriefSummary]:
    return ApiResponse(data=brief_service.get_brief(workspace_id, current_user.user_id, brief_id))


@router.delete("/{brief_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brief(
    workspace_id: UUID,
    brief_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    brief_service: BriefService = Depends(get_brief_service),
) -> None:
    brief_service.delete_brief(workspace_id, current_user.user_id, brief_id)


@router.patch("/{brief_id}/draft", response_model=ApiResponse[BriefSummary])
async def save_brief_draft(
    workspace_id: UUID,
    brief_id: UUID,
    request: SaveBriefDraftRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    brief_service: BriefService = Depends(get_brief_service),
) -> ApiResponse[BriefSummary]:
    return ApiResponse(
        data=brief_service.save_draft(workspace_id, current_user.user_id, brief_id, request)
    )


@router.post("/{brief_id}:approve", response_model=ApiResponse[BriefSummary])
async def approve_brief(
    workspace_id: UUID,
    brief_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    brief_service: BriefService = Depends(get_brief_service),
) -> ApiResponse[BriefSummary]:
    return ApiResponse(
        data=brief_service.approve_brief(workspace_id, current_user.user_id, brief_id)
    )


@router.post("/{brief_id}/revisions", response_model=ApiResponse[BriefSummary])
async def request_brief_revision(
    workspace_id: UUID,
    brief_id: UUID,
    request: RequestBriefRevisionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    brief_service: BriefService = Depends(get_brief_service),
) -> ApiResponse[BriefSummary]:
    return ApiResponse(
        data=brief_service.request_revision(workspace_id, current_user.user_id, brief_id, request)
    )
