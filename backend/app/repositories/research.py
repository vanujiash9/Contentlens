from typing import Any
from uuid import UUID

from supabase import Client

from app.integrations.search_provider import SearchResult
from app.integrations.source_fetcher import FetchedSource

QUERY_SELECT = "id, topic_id, query, results_count, status, created_at"
SOURCE_SELECT = (
    "id, topic_id, title, url, domain, type, relevance, published_date, extracted_info, "
    "created_at"
)
FINDING_SELECT = "id, topic_id, claim, confidence, created_at"
GAP_SELECT = "id, topic_id, title, description, importance, evidence, created_at"
OPPORTUNITY_SELECT = (
    "topic_id, score, priority, recommendation, angle, audience, reasons, breakdown"
)
PLAN_SELECT = "topic_id, objective, approach, questions"


class ResearchRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def list_queries(self, topic_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("search_queries")
            .select(QUERY_SELECT)
            .eq("topic_id", str(topic_id))
            .order("created_at")
            .execute()
        )
        return [map_query(row) for row in list(response.data or [])]

    def create_query(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        query: str,
        result_count: int,
    ) -> dict:
        response = (
            self.supabase.table("search_queries")
            .insert(
                {
                    "workspace_id": str(workspace_id),
                    "topic_id": str(topic_id),
                    "query": query,
                    "results_count": result_count,
                    "status": "completed",
                }
            )
            .execute()
        )
        return map_query(response.data[0])

    def insert_serp_results(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        query_id: UUID,
        results: list[SearchResult],
    ) -> list[dict]:
        _ = query_id
        rows = [
            {
                "workspace_id": str(workspace_id),
                "topic_id": str(topic_id),
                "title": result.title,
                "url": result.url,
                "domain": domain_from_url(result.url),
                "type": "article",
                "relevance": 70,
                "extracted_info": result.snippet,
            }
            for result in results
        ]
        if not rows:
            return []
        response = self.supabase.table("sources").insert(rows).execute()
        return [map_source(row, index + 1) for index, row in enumerate(list(response.data or []))]

    def list_sources(self, topic_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("sources")
            .select(SOURCE_SELECT)
            .eq("topic_id", str(topic_id))
            .order("created_at")
            .execute()
        )
        return [map_source(row, index + 1) for index, row in enumerate(list(response.data or []))]

    def mark_source_fetched(
        self,
        *,
        source_id: UUID,
        fetched_source: FetchedSource,
    ) -> dict:
        extracted_info = build_extracted_info(fetched_source)
        response = (
            self.supabase.table("sources")
            .update(
                {
                    "title": fetched_source.title,
                    "url": fetched_source.url,
                    "domain": fetched_source.domain,
                    "type": "article",
                    "relevance": 80,
                    "extracted_info": extracted_info,
                }
            )
            .eq("id", str(source_id))
            .execute()
        )
        return map_source(response.data[0], None, fetched_source)

    def mark_source_failed(self, *, source_id: UUID, error_message: str) -> dict:
        response = (
            self.supabase.table("sources")
            .update({"relevance": 0, "extracted_info": error_message})
            .eq("id", str(source_id))
            .execute()
        )
        return map_source(response.data[0], None)

    def get_plan(self, topic_id: UUID) -> dict | None:
        response = (
            self.supabase.table("research_plans")
            .select(PLAN_SELECT)
            .eq("topic_id", str(topic_id))
            .limit(1)
            .execute()
        )
        rows = list(response.data or [])
        return map_plan(rows[0]) if rows else None

    def upsert_plan(self, *, workspace_id: UUID, topic_id: UUID, plan: dict[str, Any]) -> dict:
        row = {
            "workspace_id": str(workspace_id),
            "topic_id": str(topic_id),
            "objective": plan["objective"],
            "approach": plan.get("search_intent"),
            "questions": plan.get("notes") or [],
        }
        response = (
            self.supabase.table("research_plans")
            .upsert(row, on_conflict="topic_id")
            .execute()
        )
        return map_plan(response.data[0])

    def list_findings(self, topic_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("findings")
            .select(FINDING_SELECT)
            .eq("topic_id", str(topic_id))
            .order("created_at")
            .execute()
        )
        return [map_finding(row) for row in list(response.data or [])]

    def list_information_gaps(self, topic_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("information_gaps")
            .select(GAP_SELECT)
            .eq("topic_id", str(topic_id))
            .order("created_at")
            .execute()
        )
        return [map_gap(row) for row in list(response.data or [])]

    def get_opportunity(self, topic_id: UUID) -> dict | None:
        response = (
            self.supabase.table("opportunities")
            .select(OPPORTUNITY_SELECT)
            .eq("topic_id", str(topic_id))
            .limit(1)
            .execute()
        )
        rows = list(response.data or [])
        return map_opportunity(rows[0]) if rows else None

    def insert_findings(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        findings: list[dict[str, Any]],
    ) -> list[dict]:
        rows = [
            {
                "workspace_id": str(workspace_id),
                "topic_id": str(topic_id),
                "claim": finding["claim"],
                "confidence": map_confidence(finding.get("finding_type")),
            }
            for finding in findings
        ]
        if not rows:
            return []
        response = self.supabase.table("findings").insert(rows).execute()
        return [map_finding(row) for row in list(response.data or [])]

    def insert_information_gaps(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        gaps: list[dict[str, Any]],
    ) -> list[dict]:
        rows = [
            {
                "workspace_id": str(workspace_id),
                "topic_id": str(topic_id),
                "title": gap.get("recommendation") or "Khoảng trống thông tin",
                "description": gap["description"],
                "importance": "medium",
                "evidence": gap.get("recommendation") or "",
            }
            for gap in gaps
        ]
        if not rows:
            return []
        response = self.supabase.table("information_gaps").insert(rows).execute()
        return [map_gap(row) for row in list(response.data or [])]

    def upsert_opportunity(
        self,
        *,
        workspace_id: UUID,
        topic_id: UUID,
        opportunity: dict[str, Any],
    ) -> dict:
        metadata = opportunity.get("metadata") or {}
        row = {
            "workspace_id": str(workspace_id),
            "topic_id": str(topic_id),
            "score": opportunity["score"],
            "priority": opportunity["priority"],
            "recommendation": opportunity["recommendation"],
            "angle": metadata.get("angle"),
            "audience": metadata.get("audience"),
            "reasons": metadata.get("reasons") or [],
            "breakdown": build_opportunity_breakdown(metadata),
        }
        response = (
            self.supabase.table("opportunities")
            .upsert(row, on_conflict="topic_id")
            .execute()
        )
        return map_opportunity(response.data[0])


def map_query(row: dict) -> dict:
    return {
        "id": row["id"],
        "topic_id": row["topic_id"],
        "query": row["query"],
        "result_count": row.get("result_count") or row.get("results_count") or 0,
        "created_at": row["created_at"],
    }


def map_plan(row: dict) -> dict:
    questions = list(row.get("questions") or [])
    return {
        "topic_id": row["topic_id"],
        "objective": row["objective"],
        "target_keyword": questions[0] if questions else row["objective"][:120],
        "search_intent": row.get("approach") or row["objective"],
        "audience": row.get("approach") or "Người đọc mục tiêu",
        "notes": questions,
        "approach": row.get("approach"),
        "questions": questions,
    }


def map_source(row: dict, rank: int | None, fetched_source: FetchedSource | None = None) -> dict:
    extracted_text = fetched_source.text if fetched_source else row.get("extracted_info")
    return {
        "id": row["id"],
        "topic_id": row["topic_id"],
        "query_id": None,
        "title": row["title"],
        "url": row["url"],
        "domain": row.get("domain") or domain_from_url(row["url"]),
        "rank": rank,
        "snippet": row.get("extracted_info"),
        "status": "fetched" if row.get("relevance", 0) > 0 else "failed",
        "extracted_text": extracted_text,
        "headings": [heading.__dict__ for heading in fetched_source.headings]
        if fetched_source
        else [],
        "word_count": fetched_source.word_count if fetched_source else 0,
        "questions": list(fetched_source.questions) if fetched_source else [],
        "examples": list(fetched_source.examples) if fetched_source else [],
        "tables_count": fetched_source.tables_count if fetched_source else 0,
        "images_count": fetched_source.images_count if fetched_source else 0,
        "videos_count": fetched_source.videos_count if fetched_source else 0,
        "error_message": None if row.get("relevance", 0) > 0 else row.get("extracted_info"),
        "created_at": row["created_at"],
        "fetched_at": row["created_at"],
    }


def map_finding(row: dict) -> dict:
    return {
        "id": row["id"],
        "topic_id": row["topic_id"],
        "claim": row["claim"],
        "finding_type": row.get("confidence") or "medium",
        "source_ids": [],
        "metadata": {},
        "created_at": row["created_at"],
    }


def map_gap(row: dict) -> dict:
    return {
        "id": row["id"],
        "topic_id": row["topic_id"],
        "description": row.get("description") or row.get("title") or "Khoảng trống thông tin",
        "recommendation": row.get("evidence") or row.get("title"),
        "created_at": row["created_at"],
    }


def map_opportunity(row: dict) -> dict:
    metadata = {
        "angle": row.get("angle"),
        "audience": row.get("audience"),
        "reasons": list(row.get("reasons") or []),
        "breakdown": list(row.get("breakdown") or []),
    }
    metadata.update(extract_structured_metadata(row.get("breakdown") or []))
    return {
        "topic_id": row["topic_id"],
        "score": row["score"],
        "priority": row["priority"],
        "recommendation": row.get("recommendation") or "",
        "metadata": metadata,
    }


def build_extracted_info(fetched_source: FetchedSource) -> str:
    headings = "\n".join(
        f"{heading.level.upper()}: {heading.text}" for heading in fetched_source.headings
    )
    return "\n\n".join(
        part
        for part in [
            fetched_source.text,
            f"Word count: {fetched_source.word_count}",
            headings,
            format_optional_list("Questions", fetched_source.questions),
            format_optional_list("Examples", fetched_source.examples),
            (
                f"Tables: {fetched_source.tables_count}; "
                f"Images: {fetched_source.images_count}; Videos: {fetched_source.videos_count}"
            ),
        ]
        if part
    )


def format_optional_list(label: str, values: list[str]) -> str:
    if not values:
        return ""
    return f"{label}: " + "; ".join(values)


def build_opportunity_breakdown(metadata: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {"label": "competitor_analysis", "data": metadata.get("competitor_analysis") or []},
        {"label": "cross_serp_analysis", "data": metadata.get("cross_serp_analysis")},
        {"label": "warnings", "data": metadata.get("warnings") or []},
        {"label": "source_fetch_limit", "score": metadata.get("source_fetch_limit") or 0},
        {"label": "fetched_sources", "score": metadata.get("fetched_sources") or 0},
    ]


def extract_structured_metadata(breakdown: list[dict[str, Any]]) -> dict[str, Any]:
    metadata: dict[str, Any] = {}
    for item in breakdown:
        label = item.get("label")
        if label in {"competitor_analysis", "cross_serp_analysis", "warnings"}:
            metadata[str(label)] = item.get("data")
        if label in {"source_fetch_limit", "fetched_sources"}:
            metadata[str(label)] = item.get("score")
    return metadata


def map_confidence(finding_type: object) -> str:
    if finding_type in {"high", "medium", "low"}:
        return str(finding_type)
    return "medium"


def domain_from_url(url: str) -> str:
    try:
        from urllib.parse import urlparse

        return urlparse(url).netloc
    except Exception:
        return ""
