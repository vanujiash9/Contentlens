from uuid import UUID

from fastapi import HTTPException, status

from app.core.security import AuthenticatedUser
from app.repositories.workspaces import WorkspaceRepository
from app.schemas.workspaces import CurrentUserResponse, WorkspaceSummary


def parse_user_id(user_id: str) -> UUID:
    try:
        return UUID(user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authenticated user.",
        ) from exc


class WorkspaceService:
    def __init__(self, workspace_repository: WorkspaceRepository) -> None:
        self.workspace_repository = workspace_repository

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
