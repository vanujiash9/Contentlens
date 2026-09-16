from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.api.dependencies import get_current_user
from app.core.security import AuthenticatedUser
from app.core.supabase import get_supabase_client
from app.repositories.workspaces import WorkspaceRepository
from app.schemas.common import ApiResponse
from app.schemas.workspaces import CurrentUserResponse, WorkspaceResponse, WorkspaceSummary
from app.services.workspaces import WorkspaceService

router = APIRouter(tags=["workspaces"])


def get_workspace_service(
    supabase: Client = Depends(get_supabase_client),
) -> WorkspaceService:
    return WorkspaceService(WorkspaceRepository(supabase))


@router.get("/me", response_model=ApiResponse[CurrentUserResponse])
async def get_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[CurrentUserResponse]:
    return ApiResponse(data=workspace_service.get_current_user(current_user))


@router.get("/workspaces", response_model=ApiResponse[list[WorkspaceSummary]])
async def list_workspaces(
    current_user: AuthenticatedUser = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[list[WorkspaceSummary]]:
    return ApiResponse(data=workspace_service.get_current_user(current_user).workspaces)


@router.post(
    "/workspaces",
    response_model=ApiResponse[WorkspaceResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_workspace() -> ApiResponse[WorkspaceResponse]:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "Workspace creation is defined in the contract and will be implemented "
            "with persistence."
        ),
    )
