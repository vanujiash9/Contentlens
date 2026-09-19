from uuid import UUID

from fastapi import HTTPException, status

from app.integrations.search_provider import SearchProviderNotConfiguredError
from app.repositories.research import ResearchRepository
from app.repositories.topics import TopicRepository
from app.repositories.workflow_runs import WorkflowRunRepository
from app.repositories.workspaces import WorkspaceRepository
from app.schemas.research import TopicResearchAggregate
from app.schemas.topics import TopicDetailResponse, TopicListResponse, TopicSummary, TopicWorkflowStatus
from app.services.workspaces import parse_user_id
from app.workflows.core import WorkflowError
from app.workflows.research import ResearchWorkflow, ResearchWorkflowInput

MAX_TOPIC_TITLE_LENGTH = 240
TOPIC_RESEARCH_WORKFLOW_NAME = "topic_research"
TOPIC_SUBJECT_TYPE = "topic"


class TopicService:
    def __init__(
        self,
        topic_repository: TopicRepository,
        workspace_repository: WorkspaceRepository,
        research_repository: ResearchRepository | None = None,
        workflow_run_repository: WorkflowRunRepository | None = None,
        research_workflow: ResearchWorkflow | None = None,
    ) -> None:
        self.topic_repository = topic_repository
        self.workspace_repository = workspace_repository
        self.research_repository = research_repository
        self.workflow_run_repository = workflow_run_repository
        self.research_workflow = research_workflow

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

    def get_topic_detail(
        self,
        workspace_id: UUID,
        topic_id: UUID,
        current_user_id: str,
    ) -> TopicDetailResponse:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        row = self.topic_repository.get_by_id(workspace_id, topic_id)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

        return TopicDetailResponse(
            topic=self._map_topic(row),
            research=self._map_research(topic_id),
            workflow=self._map_latest_workflow(workspace_id, topic_id),
        )

    def start_topic(
        self,
        workspace_id: UUID,
        topic_id: UUID,
        current_user_id: str,
    ) -> TopicSummary:
        return self._run_research(workspace_id, topic_id, current_user_id, allow_retry=False)

    def retry_topic(
        self,
        workspace_id: UUID,
        topic_id: UUID,
        current_user_id: str,
    ) -> TopicSummary:
        return self._run_research(workspace_id, topic_id, current_user_id, allow_retry=True)

    def _run_research(
        self,
        workspace_id: UUID,
        topic_id: UUID,
        current_user_id: str,
        allow_retry: bool,
    ) -> TopicSummary:
        if self.research_workflow is None or self.workflow_run_repository is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "SEARCH_NOT_CONFIGURED",
                    "message": "Search provider is not configured.",
                },
            )

        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        topic = self.topic_repository.get_by_id(workspace_id, topic_id)
        if topic is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
        if topic["status"] == "processing":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Topic research is already running",
            )
        if allow_retry is False and topic["status"] == "completed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Topic research is already completed",
            )

        workflow_run = self.workflow_run_repository.create_run(
            workspace_id=workspace_id,
            user_id=user_id,
            workflow_name=TOPIC_RESEARCH_WORKFLOW_NAME,
            subject_type=TOPIC_SUBJECT_TYPE,
            subject_id=topic_id,
            input_data={"topic_id": str(topic_id), "topic_title": topic["title"]},
        )
        workflow_run_id = UUID(str(workflow_run["id"]))
        self.topic_repository.mark_processing(
            workspace_id,
            topic_id,
            "Đang tìm kiếm và đọc nguồn cạnh tranh",
        )

        try:
            result = self.research_workflow.run(
                run_id=workflow_run_id,
                workspace_id=workspace_id,
                request=ResearchWorkflowInput(topic_id=topic_id, topic_title=topic["title"]),
            )
        except WorkflowError as error:
            error_code, error_message = map_research_workflow_error(error)
            self.workflow_run_repository.mark_failed(
                workspace_id=workspace_id,
                run_id=workflow_run_id,
                error_code=error_code,
                error_message=error_message,
            )
            self.topic_repository.mark_failed(workspace_id, topic_id, error_message)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"code": error_code, "message": error_message},
            ) from error

        opportunity = self.research_repository.get_opportunity(topic_id) if self.research_repository else None
        row = self.topic_repository.mark_completed(
            workspace_id,
            topic_id,
            opportunity.get("score") if opportunity else None,
            opportunity.get("priority") if opportunity else None,
        )
        self.workflow_run_repository.mark_completed(
            workspace_id=workspace_id,
            run_id=workflow_run_id,
            output_data={
                "queries_count": result.queries_count,
                "sources_count": result.sources_count,
                "fetched_sources_count": result.fetched_sources_count,
                "failed_sources_count": result.failed_sources_count,
            },
            provider="search_provider",
            model="deterministic_research_workflow",
            input_tokens=None,
            output_tokens=None,
        )
        return self._map_topic(row)

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

    def _map_research(self, topic_id: UUID) -> TopicResearchAggregate:
        if self.research_repository is None:
            return TopicResearchAggregate()

        return TopicResearchAggregate(
            plan=self.research_repository.get_plan(topic_id),
            queries=self.research_repository.list_queries(topic_id),
            sources=self.research_repository.list_sources(topic_id),
            findings=self.research_repository.list_findings(topic_id),
            information_gaps=self.research_repository.list_information_gaps(topic_id),
            opportunity=self.research_repository.get_opportunity(topic_id),
        )

    def _map_latest_workflow(
        self,
        workspace_id: UUID,
        topic_id: UUID,
    ) -> TopicWorkflowStatus | None:
        if self.workflow_run_repository is None:
            return None

        row = self.workflow_run_repository.get_latest_for_subject(
            workspace_id=workspace_id,
            subject_type=TOPIC_SUBJECT_TYPE,
            subject_id=topic_id,
        )
        if row is None:
            return None

        return TopicWorkflowStatus(
            id=row["id"],
            workflow_name=row["workflow_name"],
            status=row["status"],
            error_code=row.get("error_code"),
            error_message=row.get("error_message"),
            started_at=row.get("started_at"),
            completed_at=row.get("completed_at"),
            failed_at=row.get("failed_at"),
        )

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


def map_research_workflow_error(error: WorkflowError) -> tuple[str, str]:
    if isinstance(error.cause, SearchProviderNotConfiguredError):
        return "SEARCH_NOT_CONFIGURED", "Search provider is not configured."
    return "RESEARCH_WORKFLOW_FAILED", "Topic research is temporarily unavailable."
