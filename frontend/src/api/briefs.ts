import type { ApiClient } from "./client"

export async function listBriefs(apiClient: ApiClient, workspaceId: string): Promise<unknown[]> {
  return apiClient.request<unknown[]>(`/api/v1/workspaces/${workspaceId}/briefs`)
}
