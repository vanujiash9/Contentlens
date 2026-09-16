from uuid import UUID

from fastapi import HTTPException, status
from postgrest.exceptions import APIError

from app.core.security import AuthenticatedUser
from app.repositories.workspaces import WorkspaceRepository
from app.schemas.workspaces import (
    CreateWorkspaceRequest,
    CurrentUserResponse,
    WorkspaceResponse,
    WorkspaceSummary,
)


def parse_user_id(user_id: str) -> UUID:
    try:
        return UUID(user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authenticated user.",
        ) from exc


def map_workspace_create_error(exc: APIError) -> HTTPException:
    message = str(exc).lower()
    if "duplicate" in message or "unique" in message:
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Workspace slug already exists.",
        )

    return workspace_creation_failed_error()


def workspace_creation_failed_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Workspace creation failed.",
    )


class WorkspaceService:
    def __init__(self, workspace_repository: WorkspaceRepository) -> None:
        self.workspace_repository = workspace_repository

    def create_workspace(
        self,
        request: CreateWorkspaceRequest,
        current_user: AuthenticatedUser,
    ) -> WorkspaceResponse:
        user_id = parse_user_id(current_user.user_id)
        try:
            workspace = self.workspace_repository.create_workspace(
                name=request.name,
                slug=request.slug,
                created_by=user_id,
            )
            workspace_id = UUID(workspace["id"])
            try:
                self.workspace_repository.create_owner_membership(workspace_id, user_id)
            except APIError as exc:
                self.workspace_repository.delete_workspace(workspace_id)
                raise workspace_creation_failed_error() from exc
        except APIError as exc:
            raise map_workspace_create_error(exc) from exc

        return WorkspaceResponse.model_validate(workspace)

    def get_current_user(self, current_user: AuthenticatedUser) -> CurrentUserResponse:
        user_id = parse_user_id(current_user.user_id)
        memberships = self.workspace_repository.list_for_user(user_id)
        workspaces = [self._map_workspace_membership(row) for row in memberships]

        return CurrentUserResponse(
            user_id=user_id,
            email=current_user.email,
            workspaces=workspaces,
        )

    @staticmethod
    def _map_workspace_membership(row: dict) -> WorkspaceSummary:
        workspace = row.get("workspaces") or {}
        return WorkspaceSummary(
            id=workspace["id"],
            name=workspace["name"],
            slug=workspace["slug"],
            role=row["role"],
        )
