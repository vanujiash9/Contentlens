from datetime import datetime, timezone
from uuid import UUID

from supabase import Client

from app.schemas.briefs import ContentBriefGeneration

BRIEF_SELECT = (
    "id, workspace_id, topic_id, title, search_intent, target_audience, objective, angle, "
    "key_questions, outline, key_facts, draft, must_cover, must_avoid, evidence_map, "
    "review_status, approved_at, word_count, sources_used, total_claims, cited_claims, "
    "quality_checks, quality_warnings, created_at, updated_at, version"
)


class BriefRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def list_by_workspace(self, workspace_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("content_briefs")
            .select(BRIEF_SELECT)
            .eq("workspace_id", str(workspace_id))
            .order("updated_at", desc=True)
            .execute()
        )
        return list(response.data or [])

    def get_by_id(self, workspace_id: UUID, brief_id: UUID) -> dict | None:
        response = (
            self.supabase.table("content_briefs")
            .select(BRIEF_SELECT)
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(brief_id))
            .limit(1)
            .execute()
        )
        rows = list(response.data or [])
        return rows[0] if rows else None

    def upsert_generated_brief(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        generation: ContentBriefGeneration,
    ) -> dict:
        response = (
            self.supabase.table("content_briefs")
            .upsert(
                {
                    "workspace_id": str(workspace_id),
                    "topic_id": str(topic_id),
                    "title": generation.title,
                    "search_intent": generation.search_intent,
                    "target_audience": generation.target_audience,
                    "objective": generation.objective,
                    "angle": generation.angle,
                    "key_questions": generation.key_questions,
                    "outline": generation.outline,
                    "key_facts": generation.key_facts,
                    "draft": generation.draft,
                    "must_cover": generation.must_cover,
                    "must_avoid": generation.must_avoid,
                    "evidence_map": generation.evidence_map,
                    "quality_checks": generation.quality_checks,
                    "quality_warnings": generation.quality_warnings,
                    "review_status": "pending_review",
                    "approved_at": None,
                    "approved_by": None,
                },
                on_conflict="topic_id",
            )
            .execute()
        )
        return response.data[0]

    def update_draft(
        self,
        *,
        workspace_id: UUID,
        brief_id: UUID,
        draft: str,
    ) -> dict:
        response = (
            self.supabase.table("content_briefs")
            .update({"draft": draft, "review_status": "pending_review"})
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(brief_id))
            .execute()
        )
        return response.data[0]

    def approve(
        self,
        *,
        workspace_id: UUID,
        brief_id: UUID,
        user_id: UUID,
    ) -> dict:
        response = (
            self.supabase.table("content_briefs")
            .update(
                {
                    "review_status": "approved",
                    "approved_at": datetime.now(timezone.utc).isoformat(),
                    "approved_by": str(user_id),
                }
            )
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(brief_id))
            .execute()
        )
        return response.data[0]

    def create_revision_request(
        self,
        *,
        workspace_id: UUID,
        brief_id: UUID,
        user_id: UUID,
        request: str,
    ) -> dict:
        response = (
            self.supabase.table("brief_revision_requests")
            .insert(
                {
                    "workspace_id": str(workspace_id),
                    "brief_id": str(brief_id),
                    "requested_by": str(user_id),
                    "request": request,
                    "status": "processing",
                }
            )
            .execute()
        )
        return response.data[0]

    def mark_revision_completed(self, *, workspace_id: UUID, revision_id: UUID) -> dict:
        response = (
            self.supabase.table("brief_revision_requests")
            .update(
                {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(revision_id))
            .execute()
        )
        return response.data[0]

    def mark_revision_failed(self, *, workspace_id: UUID, revision_id: UUID) -> dict:
        response = (
            self.supabase.table("brief_revision_requests")
            .update({"status": "failed"})
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(revision_id))
            .execute()
        )
        return response.data[0]
