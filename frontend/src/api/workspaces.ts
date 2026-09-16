import type { ApiClient } from "./client"

export interface WorkspaceSummaryDto {
  id: string
  name: string
  slug: string
  role: string
}

export interface CurrentUserDto {
  user_id: string
  email: string | null
  workspaces: WorkspaceSummaryDto[]
}

export async function getCurrentUser(apiClient: ApiClient): Promise<CurrentUserDto> {
  return apiClient.request<CurrentUserDto>("/api/v1/me")
}
