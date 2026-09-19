from typing import Any
from uuid import UUID

from supabase import Client

from app.integrations.search_provider import SearchResult
from app.integrations.source_fetcher import FetchedSource

QUERY_SELECT = "id, topic_id, query, result_count, created_at"
SOURCE_SELECT = (
    "id, topic_id, query_id, title, url, domain, rank, snippet, status, extracted_text, "
    "error_message, created_at, fetched_at"
)
FINDING_SELECT = "id, topic_id, claim, finding_type, source_ids, metadata, created_at"
GAP_SELECT = "id, topic_id, description, recommendation, created_at"
OPPORTUNITY_SELECT = "topic_id, score, priority, recommendation, metadata"
PLAN_SELECT = "topic_id, objective, target_keyword, search_intent, audience, notes"


class ResearchRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def list_queries(self, topic_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("research_search_queries")
            .select(QUERY_SELECT)
            .eq("topic_id", str(topic_id))
            .order("created_at")
            .execute()
        )
        return list(response.data or [])

    def create_query(self, *, topic_id: UUID, query: str, result_count: int) -> dict:
        response = (
            self.supabase.table("research_search_queries")
            .insert({"topic_id": str(topic_id), "query": query, "result_count": result_count})
            .execute()
        )
        return response.data[0]

    def insert_serp_results(
        self,
        *,
        topic_id: UUID,
        query_id: UUID,
        results: list[SearchResult],
    ) -> list[dict]:
        rows = [
            {
                "topic_id": str(topic_id),
                "query_id": str(query_id),
                "title": result.title,
                "url": result.url,
                "rank": result.rank,
                "snippet": result.snippet,
                "status": "pending",
            }
            for result in results
        ]
        if not rows:
            return []
        response = self.supabase.table("research_sources").insert(rows).execute()
        return list(response.data or [])

    def list_sources(self, topic_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("research_sources")
            .select(SOURCE_SELECT)
            .eq("topic_id", str(topic_id))
            .order("rank")
            .execute()
        )
        return list(response.data or [])

    def mark_source_fetched(
        self,
        *,
        source_id: UUID,
        fetched_source: FetchedSource,
    ) -> dict:
        response = (
            self.supabase.table("research_sources")
            .update(
                {
                    "title": fetched_source.title,
                    "url": fetched_source.url,
                    "domain": fetched_source.domain,
                    "status": "fetched",
                    "extracted_text": fetched_source.text,
                    "error_message": None,
                    "fetched_at": "now()",
                }
            )
            .eq("id", str(source_id))
            .execute()
        )
        return response.data[0]

    def mark_source_failed(self, *, source_id: UUID, error_message: str) -> dict:
        response = (
            self.supabase.table("research_sources")
            .update({"status": "failed", "error_message": error_message})
            .eq("id", str(source_id))
            .execute()
        )
        return response.data[0]

    def get_plan(self, topic_id: UUID) -> dict | None:
        response = (
            self.supabase.table("research_plans")
            .select(PLAN_SELECT)
            .eq("topic_id", str(topic_id))
            .limit(1)
            .execute()
        )
        rows = list(response.data or [])
        return rows[0] if rows else None

    def upsert_plan(self, *, topic_id: UUID, plan: dict[str, Any]) -> dict:
        response = (
            self.supabase.table("research_plans")
            .upsert({"topic_id": str(topic_id), **plan}, on_conflict="topic_id")
            .execute()
        )
        return response.data[0]

    def list_findings(self, topic_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("research_findings")
            .select(FINDING_SELECT)
            .eq("topic_id", str(topic_id))
            .order("created_at")
            .execute()
        )
        return list(response.data or [])

    def list_information_gaps(self, topic_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("research_information_gaps")
            .select(GAP_SELECT)
            .eq("topic_id", str(topic_id))
            .order("created_at")
            .execute()
        )
        return list(response.data or [])

    def get_opportunity(self, topic_id: UUID) -> dict | None:
        response = (
            self.supabase.table("research_opportunities")
            .select(OPPORTUNITY_SELECT)
            .eq("topic_id", str(topic_id))
            .limit(1)
            .execute()
        )
        rows = list(response.data or [])
        return rows[0] if rows else None

    def insert_findings(self, *, topic_id: UUID, findings: list[dict[str, Any]]) -> list[dict]:
        rows = [{"topic_id": str(topic_id), **finding} for finding in findings]
        if not rows:
            return []
        response = self.supabase.table("research_findings").insert(rows).execute()
        return list(response.data or [])

    def insert_information_gaps(self, *, topic_id: UUID, gaps: list[dict[str, Any]]) -> list[dict]:
        rows = [{"topic_id": str(topic_id), **gap} for gap in gaps]
        if not rows:
            return []
        response = self.supabase.table("research_information_gaps").insert(rows).execute()
        return list(response.data or [])

    def upsert_opportunity(self, *, topic_id: UUID, opportunity: dict[str, Any]) -> dict:
        response = (
            self.supabase.table("research_opportunities")
            .upsert({"topic_id": str(topic_id), **opportunity}, on_conflict="topic_id")
            .execute()
        )
        return response.data[0]
