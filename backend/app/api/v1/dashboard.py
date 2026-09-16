from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.core.security import AuthenticatedUser
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/workspaces/{workspace_id}", tags=["dashboard"])


@router.get("/dashboard", response_model=ApiResponse[dict])
async def get_dashboard(
    workspace_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[dict]:
    _ = (workspace_id, current_user)
    return ApiResponse(data={"totals": {}, "qualityTrend": [], "recentContent": []})


@router.get("/activities", response_model=ApiResponse[list[dict]])
async def list_activities(
    workspace_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[list[dict]]:
    _ = (workspace_id, current_user)
    return ApiResponse(data=[])
