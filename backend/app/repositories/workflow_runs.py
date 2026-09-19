from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from supabase import Client


WORKFLOW_RUN_SELECT = (
    "id, workflow_name, subject_type, subject_id, status, error_code, error_message, "
    "started_at, completed_at, failed_at"
)


class WorkflowRunRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def create_run(
        self,
        *,
        workspace_id: UUID,
        user_id: UUID,
        workflow_name: str,
        input_data: dict[str, Any],
        subject_type: str | None = None,
        subject_id: UUID | None = None,
    ) -> dict:
        response = (
            self.supabase.table("workflow_runs")
            .insert(
                {
                    "workspace_id": str(workspace_id),
                    "created_by": str(user_id),
                    "workflow_name": workflow_name,
                    "subject_type": subject_type,
                    "subject_id": str(subject_id) if subject_id is not None else None,
                    "status": "processing",
                    "input": input_data,
                    "started_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .execute()
        )
        return response.data[0]

    def mark_completed(
        self,
        *,
        workspace_id: UUID,
        run_id: UUID,
        output_data: dict[str, Any],
        provider: str,
        model: str,
        input_tokens: int | None,
        output_tokens: int | None,
    ) -> dict:
        response = (
            self.supabase.table("workflow_runs")
            .update(
                {
                    "status": "completed",
                    "output": output_data,
                    "provider": provider,
                    "model": model,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "error_code": None,
                    "error_message": None,
                }
            )
            .eq("workspace_id", str(workspace_id))
            .eq("id", str(run_id))
            .execute()
        )
        return response.data[0]

    def mark_failed(
        self,
        *,
        workspace_id: UUID,
        run_id: UUID,
        error_code: str,
        error_message: str,
    ) -> dict:
        response = (
            self.supabase.table("workflow_runs")
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

    def get_latest_for_subject(
        self,
        *,
        workspace_id: UUID,
        subject_type: str,
        subject_id: UUID,
    ) -> dict | None:
        response = (
            self.supabase.table("workflow_runs")
            .select(WORKFLOW_RUN_SELECT)
            .eq("workspace_id", str(workspace_id))
            .eq("subject_type", subject_type)
            .eq("subject_id", str(subject_id))
            .order("started_at", desc=True)
            .limit(1)
            .execute()
        )
        rows = list(response.data or [])
        return rows[0] if rows else None
