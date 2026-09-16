from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class WorkspaceSummary(BaseModel):
    id: UUID
    name: str
    slug: str
    role: str


class CurrentUserResponse(BaseModel):
    user_id: UUID
    email: str | None
    workspaces: list[WorkspaceSummary]


class CreateWorkspaceRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    created_at: datetime
