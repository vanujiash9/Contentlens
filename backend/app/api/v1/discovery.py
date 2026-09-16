from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.core.security import AuthenticatedUser
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/workspaces/{workspace_id}/discovery-runs", tags=["discovery"])


@router.post("", response_model=ApiResponse[dict], status_code=status.HTTP_202_ACCEPTED)
async def create_discovery_run(
    workspace_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[dict]:
    _ = (workspace_id, current_user)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Discovery execution is defined in the contract and will be implemented next.",
    )


@router.get("/{run_id}", response_model=ApiResponse[dict])
async def get_discovery_run(
    workspace_id: UUID,
    run_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[dict]:
    _ = (workspace_id, run_id, current_user)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discovery run not found")
