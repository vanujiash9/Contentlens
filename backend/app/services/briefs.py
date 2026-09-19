from uuid import UUID, uuid4

from fastapi import HTTPException, status

from app.ai.provider import AIProviderInvalidResponseError
from app.repositories.briefs import BriefRepository
from app.repositories.topics import TopicRepository
from app.repositories.workflow_runs import WorkflowRunRepository
from app.repositories.workspaces import WorkspaceRepository
from app.schemas.briefs import BriefListResponse, BriefSummary, GenerateContentBriefRequest
from app.services.workspaces import parse_user_id
from app.workflows.content_brief import ContentBriefWorkflow, ContentBriefWorkflowInput
from app.workflows.core import WorkflowError

CONTENT_BRIEF_WORKFLOW_NAME = "content_brief"
CONTENT_BRIEF_SUBJECT_TYPE = "topic"


class BriefService:
    def __init__(
        self,
        brief_repository: BriefRepository,
        topic_repository: TopicRepository,
        workspace_repository: WorkspaceRepository,
        workflow_run_repository: WorkflowRunRepository,
        workflow: ContentBriefWorkflow,
    ) -> None:
        self.brief_repository = brief_repository
        self.topic_repository = topic_repository
        self.workspace_repository = workspace_repository
        self.workflow_run_repository = workflow_run_repository
        self.workflow = workflow

    def list_briefs(self, workspace_id: UUID, current_user_id: str) -> BriefListResponse:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        rows = self.brief_repository.list_by_workspace(workspace_id)
        return BriefListResponse(briefs=[self._map_brief(row) for row in rows])

    def get_brief(
        self,
        workspace_id: UUID,
        current_user_id: str,
        brief_id: UUID,
    ) -> BriefSummary:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        row = self.brief_repository.get_by_id(workspace_id, brief_id)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brief not found")
        return self._map_brief(row)

    def generate_brief(
        self,
        workspace_id: UUID,
        current_user_id: str,
        request: GenerateContentBriefRequest,
    ) -> BriefSummary:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        topic = self.topic_repository.get_by_id(workspace_id, request.topic_id)
        if topic is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

        workflow_run = self.workflow_run_repository.create_run(
            workspace_id=workspace_id,
            user_id=user_id,
            workflow_name=CONTENT_BRIEF_WORKFLOW_NAME,
            subject_type=CONTENT_BRIEF_SUBJECT_TYPE,
            subject_id=request.topic_id,
            input_data={
                "topic_id": str(request.topic_id),
                "industry": request.industry,
                "market": request.market,
                "audience": request.audience,
                "search_intent": request.search_intent,
                "angle": request.angle,
                "business_goal": request.business_goal,
                "research_insights": request.research_insights,
            },
        )
        workflow_run_id = UUID(str(workflow_run["id"]))

        try:
            result = self.workflow.run(
                run_id=uuid4(),
                workspace_id=workspace_id,
                request=ContentBriefWorkflowInput(
                    topic=topic["title"],
                    industry=request.industry,
                    market=request.market,
                    audience=request.audience,
                    search_intent=request.search_intent,
                    angle=request.angle,
                    business_goal=request.business_goal,
                    research_insights=request.research_insights,
                ),
            )
        except WorkflowError as error:
            error_code, error_message, http_status = map_brief_workflow_error(error)
            self.workflow_run_repository.mark_failed(
                workspace_id=workspace_id,
                run_id=workflow_run_id,
                error_code=error_code,
                error_message=error_message,
            )
            raise HTTPException(
                status_code=http_status,
                detail={"code": error_code, "message": error_message},
            ) from error

        row = self.brief_repository.upsert_generated_brief(
            workspace_id=workspace_id,
            topic_id=request.topic_id,
            generation=result.generation,
        )
        self.workflow_run_repository.mark_completed(
            workspace_id=workspace_id,
            run_id=workflow_run_id,
            output_data=result.generation.model_dump(mode="json"),
            provider=result.provider,
            model=result.model,
            input_tokens=result.usage.input_tokens,
            output_tokens=result.usage.output_tokens,
        )
        return self._map_brief(row)

    def _ensure_workspace_member(self, user_id: UUID, workspace_id: UUID) -> None:
        if self.workspace_repository.is_workspace_member(user_id, workspace_id):
            return
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    @staticmethod
    def _map_brief(row: dict) -> BriefSummary:
        return BriefSummary(
            id=row["id"],
            workspace_id=row["workspace_id"],
            topic_id=row["topic_id"],
            title=row["title"],
            search_intent=row.get("search_intent"),
            target_audience=row.get("target_audience"),
            objective=row.get("objective"),
            angle=row.get("angle"),
            key_questions=list(row.get("key_questions") or []),
            outline=list(row.get("outline") or []),
            key_facts=list(row.get("key_facts") or []),
            must_cover=list(row.get("must_cover") or []),
            must_avoid=list(row.get("must_avoid") or []),
            evidence_map=list(row.get("evidence_map") or []),
            review_status=row["review_status"],
            quality_checks=list(row.get("quality_checks") or []),
            quality_warnings=list(row.get("quality_warnings") or []),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            version=row["version"],
        )


def map_brief_workflow_error(error: WorkflowError) -> tuple[str, str, int]:
    if isinstance(error.cause, AIProviderInvalidResponseError):
        return "AI_INVALID_RESPONSE", "AI returned an invalid content brief response.", 502
    return "AI_PROVIDER_UNAVAILABLE", "AI content brief generation is temporarily unavailable.", 503
