import type { ApiClient } from "./client"

export async function getDiscoveryRun(
  apiClient: ApiClient,
  workspaceId: string,
  runId: string,
): Promise<unknown> {
  return apiClient.request<unknown>(`/api/v1/workspaces/${workspaceId}/discovery-runs/${runId}`)
}
