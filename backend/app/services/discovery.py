from time import monotonic
from uuid import UUID

from fastapi import HTTPException, status

from app.ai.topic_discovery import (
    DiscoveryPromptInput,
    TopicDiscoveryError,
    TopicDiscoveryGenerator,
    raise_discovery_http_error,
)
from app.repositories.discovery import DiscoveryRepository
from app.repositories.topics import TopicRepository
from app.repositories.workspaces import WorkspaceRepository
from app.schemas.discovery import (
    CreateDiscoveryRunRequest,
    DiscoveredTopicSummary,
    DiscoveryRunSummary,
    SignalDetail,
)
from app.schemas.topics import TopicSummary
from app.services.topics import TopicService
from app.services.workspaces import parse_user_id


class DiscoveryService:
    def __init__(
        self,
        discovery_repository: DiscoveryRepository,
        topic_repository: TopicRepository,
        workspace_repository: WorkspaceRepository,
        generator: TopicDiscoveryGenerator,
    ) -> None:
        self.discovery_repository = discovery_repository
        self.topic_repository = topic_repository
        self.workspace_repository = workspace_repository
        self.generator = generator

    def create_discovery_run(
        self,
        workspace_id: UUID,
        current_user_id: str,
        request: CreateDiscoveryRunRequest,
    ) -> DiscoveryRunSummary:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        run = self.discovery_repository.create_run(
            workspace_id=workspace_id,
            user_id=user_id,
            industry=request.industry,
            market=request.market,
            period_days=request.period_days,
            result_count=request.result_count,
        )
        run_id = UUID(str(run["id"]))

        started_at = monotonic()
        try:
            result = self.generator.generate(
                DiscoveryPromptInput(
                    industry=request.industry,
                    market=request.market,
                    period_days=request.period_days,
                    result_count=request.result_count,
                )
            )
        except TopicDiscoveryError as error:
            self.discovery_repository.mark_run_failed(
                workspace_id=workspace_id,
                run_id=run_id,
                error_code=error.error_code,
                error_message=error.message,
            )
            raise_discovery_http_error(error)

        topics = self.discovery_repository.insert_topics(
            workspace_id=workspace_id,
            run_id=run_id,
            topics=result.generation.topics,
        )
        completed_run = self.discovery_repository.mark_run_completed(
            workspace_id=workspace_id,
            run_id=run_id,
            provider=result.provider,
            model=result.model,
            input_tokens=result.usage.input_tokens,
            output_tokens=result.usage.output_tokens,
            latency_ms=max(0, round((monotonic() - started_at) * 1000)),
        )

        return self._map_run(completed_run, topics)

    def get_discovery_run(
        self,
        workspace_id: UUID,
        current_user_id: str,
        run_id: UUID,
    ) -> DiscoveryRunSummary:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        run = self.discovery_repository.get_run(workspace_id, run_id)
        if run is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Discovery run not found",
            )

        topics = self.discovery_repository.list_topics_for_run(workspace_id, run_id)
        return self._map_run(run, topics)

    def add_discovered_topic_to_queue(
        self,
        workspace_id: UUID,
        current_user_id: str,
        discovered_topic_id: UUID,
    ) -> TopicSummary:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        discovered_topic = self.discovery_repository.get_discovered_topic(
            workspace_id, discovered_topic_id
        )
        if discovered_topic is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Discovered topic not found",
            )

        existing_topic_id = discovered_topic.get("topic_id")
        if existing_topic_id:
            existing_topic = self.topic_repository.get_by_id(
                workspace_id,
                UUID(str(existing_topic_id)),
            )
            if existing_topic is not None:
                return TopicService._map_topic(existing_topic)

        topic = self.topic_repository.create_from_discovered_topic(
            workspace_id=workspace_id,
            user_id=user_id,
            discovered_topic=discovered_topic,
        )
        self.discovery_repository.mark_discovered_topic_added(
            workspace_id=workspace_id,
            discovered_topic_id=discovered_topic_id,
            topic_id=UUID(str(topic["id"])),
        )

        return TopicService._map_topic(topic)

    def _ensure_workspace_member(self, user_id: UUID, workspace_id: UUID) -> None:
        if self.workspace_repository.is_workspace_member(user_id, workspace_id):
            return

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    @staticmethod
    def _map_run(row: dict, topics: list[dict]) -> DiscoveryRunSummary:
        return DiscoveryRunSummary(
            id=row["id"],
            workspace_id=row["workspace_id"],
            status=row["status"],
            industry=row.get("industry"),
            market=row.get("market"),
            period_days=parse_period_days(row.get("period")),
            result_count=row["result_count"],
            error_code=row.get("error_code"),
            error_message=row.get("error_message"),
            created_at=row["created_at"],
            completed_at=row.get("completed_at"),
            topics=[DiscoveryService._map_discovered_topic(topic) for topic in topics],
        )

    @staticmethod
    def _map_discovered_topic(row: dict) -> DiscoveredTopicSummary:
        return DiscoveredTopicSummary(
            id=row["id"],
            title=row["title"],
            opportunity_score=row["opportunity_score"],
            priority=row["priority"],
            search_signals=SignalDetail.model_validate(row["search_signals"]),
            content_gap=SignalDetail.model_validate(row["content_gap"]),
            business_relevance=SignalDetail.model_validate(row["business_relevance"]),
            angle=row.get("angle"),
            reasoning=row.get("reasoning"),
            added_to_queue_at=row.get("added_to_queue_at"),
            topic_id=row.get("topic_id"),
            created_at=row["created_at"],
        )


def parse_period_days(value: object) -> int | None:
    if value is None:
        return None
    try:
        return int(str(value))
    except ValueError:
        return None
