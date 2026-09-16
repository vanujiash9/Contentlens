from uuid import UUID

from supabase import Client


class WorkspaceRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def list_for_user(self, user_id: UUID) -> list[dict]:
        response = (
            self.supabase.table("workspace_members")
            .select("role, workspaces(id, name, slug)")
            .eq("user_id", str(user_id))
            .execute()
        )

        return list(response.data or [])

    def is_workspace_member(self, user_id: UUID, workspace_id: UUID) -> bool:
        response = (
            self.supabase.table("workspace_members")
            .select("workspace_id")
            .eq("user_id", str(user_id))
            .eq("workspace_id", str(workspace_id))
            .limit(1)
            .execute()
        )

        return len(response.data or []) > 0
