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

    def create_from_discovered_topic(
        self,
        workspace_id: UUID,
        user_id: UUID,
        discovered_topic: dict,
    ) -> dict:
        response = (
            self.supabase.table("topics")
            .insert(
                {
                    "workspace_id": str(workspace_id),
                    "created_by": str(user_id),
                    "title": discovered_topic["title"],
                    "source": "ai",
                    "opportunity_score": discovered_topic["opportunity_score"],
                    "priority": discovered_topic["priority"],
                }
            )
            .execute()
        )

        return response.data[0]

    def get_by_id(self, workspace_id: UUID, topic_id: UUID) -> dict | None:
        response = (
            self.supabase.table("topics")
            .select(
                "id, title, status, source, opportunity_score, priority, "
                "research_progress, current_step, created_at, updated_at, completed_at, version"
            )
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(topic_id))
            .limit(1)
            .execute()
        )
        rows = list(response.data or [])
        return rows[0] if rows else None

    def mark_processing(self, workspace_id: UUID, topic_id: UUID, current_step: str) -> dict:
        response = (
            self.supabase.table("topics")
            .update({"status": "processing", "research_progress": 10, "current_step": current_step})
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(topic_id))
            .execute()
        )
        return response.data[0]

    def mark_completed(
        self,
        workspace_id: UUID,
        topic_id: UUID,
        opportunity_score: int | None,
        priority: str | None,
    ) -> dict:
        response = (
            self.supabase.table("topics")
            .update(
                {
                    "status": "completed",
                    "research_progress": 100,
                    "current_step": "Nghiên cứu hoàn tất",
                    "opportunity_score": opportunity_score,
                    "priority": priority,
                    "completed_at": "now()",
                }
            )
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(topic_id))
            .execute()
        )
        return response.data[0]

    def mark_failed(self, workspace_id: UUID, topic_id: UUID, error_message: str) -> dict:
        response = (
            self.supabase.table("topics")
            .update({"status": "failed", "current_step": error_message})
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(topic_id))
            .execute()
        )
        return response.data[0]
