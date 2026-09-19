from uuid import UUID

from supabase import Client

from app.schemas.briefs import ContentBriefGeneration

BRIEF_SELECT = (
    "id, workspace_id, topic_id, title, search_intent, target_audience, objective, angle, "
    "key_questions, outline, key_facts, must_cover, must_avoid, evidence_map, review_status, "
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
                    "must_cover": generation.must_cover,
                    "must_avoid": generation.must_avoid,
                    "evidence_map": generation.evidence_map,
                    "quality_checks": generation.quality_checks,
                    "quality_warnings": generation.quality_warnings,
                },
                on_conflict="topic_id",
            )
            .execute()
        )
        return response.data[0]
