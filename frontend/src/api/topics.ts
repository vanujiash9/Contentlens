import type { Topic, TopicSource } from "@/types/domain"
import type { ApiClient } from "./client"

interface TopicSummaryDto {
  id: string
  title: string
  status: Topic["status"]
  source: TopicSource
  opportunity_score: number | null
  priority: Topic["priority"] | null
  research_progress: number
  current_step: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  version: number
}

interface TopicListDto {
  topics: TopicSummaryDto[]
}

function mapTopic(dto: TopicSummaryDto): Topic {
  return {
    id: dto.id,
    title: dto.title,
    status: dto.status,
    source: dto.source,
    opportunityScore: dto.opportunity_score ?? undefined,
    priority: dto.priority ?? undefined,
    researchProgress: dto.research_progress,
    currentStep: dto.current_step ?? undefined,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    completedAt: dto.completed_at ?? undefined,
  }
}

export async function listTopics(apiClient: ApiClient, workspaceId: string): Promise<Topic[]> {
  const response = await apiClient.request<TopicListDto>(`/api/v1/workspaces/${workspaceId}/topics`)
  return response.topics.map(mapTopic)
}

export async function createTopics(
  apiClient: ApiClient,
  workspaceId: string,
  titles: string[],
): Promise<Topic[]> {
  const response = await apiClient.request<TopicSummaryDto[]>(
    `/api/v1/workspaces/${workspaceId}/topics:batch`,
    {
      method: "POST",
      body: JSON.stringify({ titles }),
    },
  )
  return response.map(mapTopic)
}
