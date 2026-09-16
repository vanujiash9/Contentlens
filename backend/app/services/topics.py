from uuid import UUID

from fastapi import HTTPException, status

from app.repositories.topics import TopicRepository
from app.repositories.workspaces import WorkspaceRepository
from app.schemas.topics import TopicListResponse, TopicSummary
from app.services.workspaces import parse_user_id

MAX_TOPIC_TITLE_LENGTH = 240


class TopicService:
    def __init__(
        self,
        topic_repository: TopicRepository,
        workspace_repository: WorkspaceRepository,
    ) -> None:
        self.topic_repository = topic_repository
        self.workspace_repository = workspace_repository

    def list_topics(self, workspace_id: UUID, current_user_id: str) -> TopicListResponse:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        rows = self.topic_repository.list_by_workspace(workspace_id)

        return TopicListResponse(topics=[self._map_topic(row) for row in rows])

    def create_topics(
        self,
        workspace_id: UUID,
        current_user_id: str,
        titles: list[str],
    ) -> list[TopicSummary]:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        clean_titles = self._validate_titles(titles)
        rows = self.topic_repository.create_batch(workspace_id, user_id, clean_titles)

        return [self._map_topic(row) for row in rows]

    def _ensure_workspace_member(self, user_id: UUID, workspace_id: UUID) -> None:
        if self.workspace_repository.is_workspace_member(user_id, workspace_id):
            return

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    @staticmethod
    def _validate_titles(titles: list[str]) -> list[str]:
        clean_titles = [title.strip() for title in titles]
        invalid_titles = [title for title in clean_titles if len(title) == 0]
        long_titles = [title for title in clean_titles if len(title) > MAX_TOPIC_TITLE_LENGTH]

        if invalid_titles:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Topic titles cannot be empty.",
            )

        if long_titles:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Topic titles must be {MAX_TOPIC_TITLE_LENGTH} characters or fewer.",
            )

        return clean_titles

    @staticmethod
    def _map_topic(row: dict) -> TopicSummary:
        return TopicSummary(
            id=row["id"],
            title=row["title"],
            status=row["status"],
            source=row["source"],
            opportunity_score=row.get("opportunity_score"),
            priority=row.get("priority"),
            research_progress=row["research_progress"],
            current_step=row.get("current_step"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            completed_at=row.get("completed_at"),
            version=row["version"],
        )
