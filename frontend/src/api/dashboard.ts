import type { ApiClient } from "./client"

export async function getDashboard(apiClient: ApiClient, workspaceId: string): Promise<unknown> {
  return apiClient.request<unknown>(`/api/v1/workspaces/${workspaceId}/dashboard`)
}
