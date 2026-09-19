from uuid import UUID, uuid4

from fastapi import HTTPException, status

from app.ai.provider import AIProviderInvalidResponseError
from app.repositories.briefs import BriefRepository
from app.repositories.research import ResearchRepository
from app.repositories.topics import TopicRepository
from app.repositories.workflow_runs import WorkflowRunRepository
from app.repositories.workspaces import WorkspaceRepository
from app.schemas.briefs import (
    BriefListResponse,
    BriefSummary,
    GenerateContentBriefRequest,
    RequestBriefRevisionRequest,
    SaveBriefDraftRequest,
)
from app.services.workspaces import parse_user_id
from app.workflows.brief_revision import BriefRevisionWorkflow, BriefRevisionWorkflowInput
from app.workflows.content_brief import ContentBriefWorkflow, ContentBriefWorkflowInput
from app.workflows.core import WorkflowError

CONTENT_BRIEF_WORKFLOW_NAME = "content_brief"
BRIEF_REVISION_WORKFLOW_NAME = "brief_revision"
CONTENT_BRIEF_SUBJECT_TYPE = "topic"
BRIEF_SUBJECT_TYPE = "brief"


class BriefService:
    def __init__(
        self,
        brief_repository: BriefRepository,
        topic_repository: TopicRepository,
        workspace_repository: WorkspaceRepository,
        workflow_run_repository: WorkflowRunRepository,
        workflow: ContentBriefWorkflow,
        revision_workflow: BriefRevisionWorkflow,
        research_repository: ResearchRepository | None = None,
    ) -> None:
        self.brief_repository = brief_repository
        self.topic_repository = topic_repository
        self.workspace_repository = workspace_repository
        self.workflow_run_repository = workflow_run_repository
        self.workflow = workflow
        self.revision_workflow = revision_workflow
        self.research_repository = research_repository

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
        row = self._get_existing_brief(workspace_id, brief_id)
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

        research_insights = self._build_research_insights(request)
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
                "research_insights": research_insights,
            },
        )
        workflow_run_id = UUID(str(workflow_run["id"]))

        try:
            result = self.workflow.run(
                run_id=workflow_run_id,
                workspace_id=workspace_id,
                request=ContentBriefWorkflowInput(
                    topic=topic["title"],
                    industry=request.industry,
                    market=request.market,
                    audience=request.audience,
                    search_intent=request.search_intent,
                    angle=request.angle,
                    business_goal=request.business_goal,
                    research_insights=research_insights,
                ),
            )
        except WorkflowError as error:
            error_code, error_message, _http_status = map_brief_workflow_error(error)
            self.workflow_run_repository.mark_failed(
                workspace_id=workspace_id,
                run_id=workflow_run_id,
                error_code=error_code,
                error_message=error_message,
            )
            fallback_generation = build_fallback_brief_generation(
                topic=topic["title"],
                request=request,
                research_insights=research_insights,
                warning=error_message,
            )
            row = self.brief_repository.upsert_generated_brief(
                workspace_id=workspace_id,
                topic_id=request.topic_id,
                generation=fallback_generation,
            )
            return self._map_brief(row)

        generation = ensure_brief_has_draft(result.generation, topic["title"], request, research_insights)
        row = self.brief_repository.upsert_generated_brief(
            workspace_id=workspace_id,
            topic_id=request.topic_id,
            generation=generation,
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

    def save_draft(
        self,
        workspace_id: UUID,
        current_user_id: str,
        brief_id: UUID,
        request: SaveBriefDraftRequest,
    ) -> BriefSummary:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        current = self._get_existing_brief(workspace_id, brief_id)
        ensure_expected_version(current, request.expected_version)
        return self._map_brief(
            self.brief_repository.update_draft(
                workspace_id=workspace_id,
                brief_id=brief_id,
                draft=request.draft,
            )
        )

    def approve_brief(self, workspace_id: UUID, current_user_id: str, brief_id: UUID) -> BriefSummary:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        self._get_existing_brief(workspace_id, brief_id)
        return self._map_brief(
            self.brief_repository.approve(
                workspace_id=workspace_id,
                brief_id=brief_id,
                user_id=user_id,
            )
        )

    def request_revision(
        self,
        workspace_id: UUID,
        current_user_id: str,
        brief_id: UUID,
        request: RequestBriefRevisionRequest,
    ) -> BriefSummary:
        user_id = parse_user_id(current_user_id)
        self._ensure_workspace_member(user_id, workspace_id)
        current = self._get_existing_brief(workspace_id, brief_id)
        ensure_expected_version(current, request.expected_version)
        revision = self.brief_repository.create_revision_request(
            workspace_id=workspace_id,
            brief_id=brief_id,
            user_id=user_id,
            request=request.request,
        )
        revision_id = UUID(str(revision["id"]))
        workflow_run = self.workflow_run_repository.create_run(
            workspace_id=workspace_id,
            user_id=user_id,
            workflow_name=BRIEF_REVISION_WORKFLOW_NAME,
            subject_type=BRIEF_SUBJECT_TYPE,
            subject_id=brief_id,
            input_data={"brief_id": str(brief_id), "revision_request": request.request},
        )
        workflow_run_id = UUID(str(workflow_run["id"]))

        try:
            result = self.revision_workflow.run(
                run_id=workflow_run_id,
                workspace_id=workspace_id,
                request=BriefRevisionWorkflowInput(
                    revision_request=request.request,
                    current_brief=self._brief_row_to_generation_input(current),
                ),
            )
        except WorkflowError as error:
            error_code, error_message, http_status = map_brief_workflow_error(error)
            self.brief_repository.mark_revision_failed(
                workspace_id=workspace_id,
                revision_id=revision_id,
            )
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
            topic_id=UUID(str(current["topic_id"])),
            generation=result.generation,
        )
        self.brief_repository.mark_revision_completed(
            workspace_id=workspace_id,
            revision_id=revision_id,
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

    def _build_research_insights(self, request: GenerateContentBriefRequest) -> str:
        if self.research_repository is None:
            return request.research_insights

        parts: list[str] = []
        try:
            plan = self.research_repository.get_plan(request.topic_id)
        except Exception:
            return request.research_insights

        if plan:
            parts.extend(
                [
                    f"Mục tiêu nghiên cứu: {plan.get('objective')}",
                    f"Search intent: {plan.get('search_intent')}",
                    f"Đối tượng: {plan.get('audience')}",
                ]
            )

        findings = self.research_repository.list_findings(request.topic_id)
        if findings:
            parts.append("Phát hiện từ research:")
            parts.extend(f"- {finding.get('claim')}" for finding in findings[:8])

        sources = self.research_repository.list_sources(request.topic_id)
        fetched_sources = [source for source in sources if source.get("status") == "fetched"]
        if fetched_sources:
            parts.append("Nguồn đã đọc:")
            for source in fetched_sources[:6]:
                excerpt = str(source.get("extracted_text") or source.get("snippet") or "")[:700]
                parts.append(f"- {source.get('title')} ({source.get('domain') or source.get('url')}): {excerpt}")

        gaps = self.research_repository.list_information_gaps(request.topic_id)
        if gaps:
            parts.append("Khoảng trống nội dung:")
            parts.extend(f"- {gap.get('description')}" for gap in gaps[:6])

        opportunity = self.research_repository.get_opportunity(request.topic_id)
        if opportunity:
            parts.append(f"Khuyến nghị cơ hội: {opportunity.get('recommendation')}")

        if request.research_insights:
            parts.append("Ghi chú bổ sung từ giao diện:")
            parts.append(request.research_insights)

        return "\n".join(part for part in parts if part) or request.research_insights

    def _get_existing_brief(self, workspace_id: UUID, brief_id: UUID) -> dict:
        row = self.brief_repository.get_by_id(workspace_id, brief_id)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brief not found")
        return row

    @staticmethod
    def _brief_row_to_generation_input(row: dict) -> dict:
        return {
            "title": row["title"],
            "search_intent": row.get("search_intent"),
            "target_audience": row.get("target_audience"),
            "objective": row.get("objective"),
            "angle": row.get("angle"),
            "key_questions": list(row.get("key_questions") or []),
            "outline": list(row.get("outline") or []),
            "key_facts": list(row.get("key_facts") or []),
            "draft": row.get("draft") or "",
            "must_cover": list(row.get("must_cover") or []),
            "must_avoid": list(row.get("must_avoid") or []),
            "evidence_map": list(row.get("evidence_map") or []),
            "quality_checks": list(row.get("quality_checks") or []),
            "quality_warnings": list(row.get("quality_warnings") or []),
        }

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
            draft=row.get("draft"),
            must_cover=list(row.get("must_cover") or []),
            must_avoid=list(row.get("must_avoid") or []),
            evidence_map=list(row.get("evidence_map") or []),
            review_status=row["review_status"],
            approved_at=row.get("approved_at"),
            word_count=row.get("word_count") or 0,
            sources_used=row.get("sources_used") or 0,
            total_claims=row.get("total_claims") or 0,
            cited_claims=row.get("cited_claims") or 0,
            quality_checks=list(row.get("quality_checks") or []),
            quality_warnings=list(row.get("quality_warnings") or []),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            version=row["version"],
        )


def ensure_expected_version(row: dict, expected_version: int | None) -> None:
    if expected_version is None or int(row["version"]) == expected_version:
        return
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Brief version changed")


def build_fallback_brief_generation(
    *,
    topic: str,
    request: GenerateContentBriefRequest,
    research_insights: str,
    warning: str,
) -> object:
    from app.schemas.briefs import ContentBriefGeneration

    outline = [
        {"section": "Mở bài", "description": f"Nêu vấn đề và nhu cầu tìm hiểu về {topic}."},
        {"section": "Tiêu chí đánh giá", "description": "Liệt kê các tiêu chí thực tế người đọc nên cân nhắc."},
        {"section": "Khuyến nghị hành động", "description": "Đưa checklist và lời khuyên theo từng nhóm nhu cầu."},
    ]
    key_facts = [line for line in research_insights.split("\n")[:8] if line]
    return ContentBriefGeneration(
        title=f"Content brief: {topic}",
        search_intent=request.search_intent,
        target_audience=request.audience,
        objective=request.business_goal,
        angle=request.angle,
        key_questions=[
            f"Người đọc cần biết gì trước khi quyết định về {topic}?",
            "Các tiêu chí lựa chọn hoặc so sánh quan trọng là gì?",
            "Nội dung nào cần có để hỗ trợ chuyển đổi khách hàng?",
        ],
        outline=outline,
        key_facts=key_facts,
        draft=build_fallback_draft(topic, request, outline, key_facts),
        must_cover=["Search intent", "Đối tượng mục tiêu", "Checklist hành động"],
        must_avoid=["Không bịa số liệu, nguồn hoặc trích dẫn chưa được cung cấp."],
        evidence_map=[],
        quality_checks=["Fallback brief generated because AI generation failed."],
        quality_warnings=[warning],
    )


def ensure_brief_has_draft(
    generation: object,
    topic: str,
    request: GenerateContentBriefRequest,
    research_insights: str,
) -> object:
    from app.schemas.briefs import ContentBriefGeneration

    brief = generation
    if not isinstance(brief, ContentBriefGeneration) or brief.draft.strip():
        return generation

    return brief.model_copy(
        update={
            "draft": build_fallback_draft(topic, request, brief.outline, brief.key_facts or research_insights.split("\n")[:8])
        }
    )


def build_fallback_draft(
    topic: str,
    request: GenerateContentBriefRequest,
    outline: list[dict],
    key_facts: list[str],
) -> str:
    outline_text = "\n".join(
        f"## {item.get('section') or item.get('heading') or item.get('title') or 'Phần nội dung'}\n{item.get('description') or item.get('summary') or ''}"
        for item in outline
    )
    facts_text = "\n".join(f"- {fact}" for fact in key_facts[:8]) or "- Chưa có dữ kiện nghiên cứu chi tiết."
    return (
        f"# {topic}\n\n"
        f"> Mục tiêu: {request.business_goal}\n\n"
        f"Bài viết này phục vụ nhóm độc giả: {request.audience}. "
        f"Search intent chính là: {request.search_intent}. "
        f"Góc triển khai đề xuất: {request.angle}.\n\n"
        f"## Dữ kiện cần dùng\n{facts_text}\n\n"
        f"{outline_text}\n\n"
        "## Kết luận\nTóm tắt khuyến nghị chính và dẫn người đọc đến bước hành động tiếp theo."
    )


def map_brief_workflow_error(error: WorkflowError) -> tuple[str, str, int]:
    if isinstance(error.cause, AIProviderInvalidResponseError):
        return "AI_INVALID_RESPONSE", "AI returned an invalid content brief response.", 502
    return "AI_PROVIDER_UNAVAILABLE", "AI content brief generation is temporarily unavailable.", 503
