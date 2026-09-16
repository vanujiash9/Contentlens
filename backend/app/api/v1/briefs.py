from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.core.security import AuthenticatedUser
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/workspaces/{workspace_id}/briefs", tags=["briefs"])


@router.get("", response_model=ApiResponse[list[dict]])
async def list_briefs(
    workspace_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[list[dict]]:
    _ = (workspace_id, current_user)
    return ApiResponse(data=[])


@router.get("/{brief_id}", response_model=ApiResponse[dict])
async def get_brief(
    workspace_id: UUID,
    brief_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[dict]:
    _ = (workspace_id, brief_id, current_user)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brief not found")
