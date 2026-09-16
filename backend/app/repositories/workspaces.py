from uuid import UUID

from supabase import Client

WORKSPACE_SELECT = "id, name, slug, created_at"


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

    def create_workspace(self, name: str, slug: str, created_by: UUID) -> dict:
        response = (
            self.supabase.table("workspaces")
            .insert(
                {
                    "name": name,
                    "slug": slug,
                    "created_by": str(created_by),
                }
            )
            .select(WORKSPACE_SELECT)
            .single()
            .execute()
        )

        return dict(response.data or {})

    def create_owner_membership(self, workspace_id: UUID, user_id: UUID) -> None:
        (
            self.supabase.table("workspace_members")
            .insert(
                {
                    "workspace_id": str(workspace_id),
                    "user_id": str(user_id),
                    "role": "owner",
                }
            )
            .execute()
        )

    def delete_workspace(self, workspace_id: UUID) -> None:
        self.supabase.table("workspaces").delete().eq("id", str(workspace_id)).execute()
