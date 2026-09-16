from uuid import UUID

from supabase import Client


class TopicRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def list_by_workspace(self, workspace_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("topics")
            .select(
                "id, title, status, source, opportunity_score, priority, "
                "research_progress, current_step, created_at, updated_at, completed_at, version"
            )
            .eq("workspace_id", str(workspace_id))
            .order("created_at", desc=True)
            .execute()
        )

        return list(response.data or [])

    def create_batch(self, workspace_id: UUID, user_id: UUID, titles: list[str]) -> list[dict]:
        rows = [
            {
                "workspace_id": str(workspace_id),
                "created_by": str(user_id),
                "title": title,
                "source": "user",
            }
            for title in titles
        ]
        response = self.supabase.table("topics").insert(rows).execute()

        return list(response.data or [])
