from datetime import datetime, timezone
from uuid import UUID

from supabase import Client

from app.schemas.discovery import GeneratedDiscoveredTopic

DISCOVERY_RUN_SELECT = (
    "id, workspace_id, status, industry, market, period, result_count, error_code, "
    "error_message, created_at, completed_at"
)
DISCOVERED_TOPIC_SELECT = (
    "id, discovery_run_id, title, opportunity_score, priority, search_signals, content_gap, "
    "business_relevance, angle, reasoning, added_to_queue_at, topic_id, created_at"
)


class DiscoveryRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def create_run(
        self,
        workspace_id: UUID,
        user_id: UUID,
        industry: str,
        market: str,
        period_days: int,
        result_count: int,
    ) -> dict:
        response = (
            self.supabase.table("discovery_runs")
            .insert(
                {
                    "workspace_id": str(workspace_id),
                    "created_by": str(user_id),
                    "industry": industry,
                    "market": market,
                    "period": str(period_days),
                    "result_count": result_count,
                    "status": "processing",
                    "started_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .execute()
        )
        return response.data[0]

    def get_run(self, workspace_id: UUID, run_id: UUID) -> dict | None:
        response = (
            self.supabase.table("discovery_runs")
            .select(DISCOVERY_RUN_SELECT)
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(run_id))
            .limit(1)
            .execute()
        )
        rows = list(response.data or [])
        return rows[0] if rows else None

    def list_runs(self, workspace_id: UUID, limit: int) -> list[dict]:
        response = (
            self.supabase.table("discovery_runs")
            .select(DISCOVERY_RUN_SELECT)
            .eq("workspace_id", str(workspace_id))
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return list(response.data or [])

    def get_latest_run(self, workspace_id: UUID) -> dict | None:
        rows = self.list_runs(workspace_id, 1)
        return rows[0] if rows else None

    def list_topics_for_run(self, workspace_id: UUID, run_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("discovered_topics")
            .select(DISCOVERED_TOPIC_SELECT)
            .eq("workspace_id", str(workspace_id))
            .eq("discovery_run_id", str(run_id))
            .order("rank", desc=False)
            .execute()
        )
        return list(response.data or [])

    def list_topics_for_runs(self, workspace_id: UUID, run_ids: list[UUID]) -> list[dict]:
        if not run_ids:
            return []

        response = (
            self.supabase.table("discovered_topics")
            .select(DISCOVERED_TOPIC_SELECT)
            .eq("workspace_id", str(workspace_id))
            .in_("discovery_run_id", [str(run_id) for run_id in run_ids])
            .order("rank", desc=False)
            .execute()
        )
        return list(response.data or [])

    def insert_topics(
        self,
        workspace_id: UUID,
        run_id: UUID,
        topics: list[GeneratedDiscoveredTopic],
    ) -> list[dict]:
        rows = [
            {
                "workspace_id": str(workspace_id),
                "discovery_run_id": str(run_id),
                "title": topic.title,
                "opportunity_score": topic.opportunity_score,
                "priority": topic.priority,
                "angle": topic.angle,
                "reasoning": topic.reasoning,
                "search_signals": topic.search_signals.model_dump(),
                "content_gap": topic.content_gap.model_dump(),
                "business_relevance": topic.business_relevance.model_dump(),
                "rank": index + 1,
            }
            for index, topic in enumerate(topics)
        ]
        response = self.supabase.table("discovered_topics").insert(rows).execute()
        return list(response.data or [])

    def mark_run_completed(
        self,
        workspace_id: UUID,
        run_id: UUID,
        provider: str,
        model: str,
        input_tokens: int | None,
        output_tokens: int | None,
        latency_ms: int,
    ) -> dict:
        response = (
            self.supabase.table("discovery_runs")
            .update(
                {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "provider": provider,
                    "model": model,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "latency_ms": latency_ms,
                    "error_code": None,
                    "error_message": None,
                }
            )
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(run_id))
            .execute()
        )
        return response.data[0]

    def mark_run_failed(
        self,
        workspace_id: UUID,
        run_id: UUID,
        error_code: str,
        error_message: str,
    ) -> dict:
        response = (
            self.supabase.table("discovery_runs")
            .update(
                {
                    "status": "failed",
                    "failed_at": datetime.now(timezone.utc).isoformat(),
                    "error_code": error_code,
                    "error_message": error_message,
                }
            )
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(run_id))
            .execute()
        )
        return response.data[0]

    def get_discovered_topic(self, workspace_id: UUID, discovered_topic_id: UUID) -> dict | None:
        response = (
            self.supabase.table("discovered_topics")
            .select(DISCOVERED_TOPIC_SELECT)
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(discovered_topic_id))
            .limit(1)
            .execute()
        )
        rows = list(response.data or [])
        return rows[0] if rows else None

    def mark_discovered_topic_added(
        self,
        workspace_id: UUID,
        discovered_topic_id: UUID,
        topic_id: UUID,
    ) -> dict:
        response = (
            self.supabase.table("discovered_topics")
            .update(
                {
                    "topic_id": str(topic_id),
                    "added_to_queue_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(discovered_topic_id))
            .execute()
        )
        return response.data[0]

    def delete_discovered_topic(
        self,
        workspace_id: UUID,
        discovered_topic_id: UUID,
    ) -> bool:
        response = (
            self.supabase.table("discovered_topics")
            .delete()
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(discovered_topic_id))
            .execute()
        )
        return len(response.data or []) > 0
