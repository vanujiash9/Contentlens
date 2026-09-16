import type { DiscoveredTopic, SignalDetail, Topic } from "@/types/domain"
import type { ApiClient } from "./client"
import { mapTopic } from "./topics"

interface SignalDetailDto {
  score: number
  level: SignalDetail["level"]
  source: string
  evidence: string
}

interface DiscoveredTopicDto {
  id: string
  title: string
  opportunity_score: number
  priority: DiscoveredTopic["priority"]
  search_signals: SignalDetailDto
  content_gap: SignalDetailDto
  business_relevance: SignalDetailDto
  angle: string | null
  reasoning: string | null
  added_to_queue_at: string | null
  topic_id: string | null
  created_at: string
}

interface DiscoveryRunDto {
  id: string
  workspace_id: string
  status: "pending" | "processing" | "completed" | "failed"
  industry: string | null
  market: string | null
  period_days: number | null
  result_count: number
  error_code: string | null
  error_message: string | null
  created_at: string
  completed_at: string | null
  topics: DiscoveredTopicDto[]
}

interface AddDiscoveredTopicResponseDto {
  topic: Parameters<typeof mapTopic>[0]
}

export interface CreateDiscoveryRunRequest {
  industry: string
  market: string
  periodDays: 7 | 30 | 90
  resultCount: number
}

export interface DiscoveryRun {
  id: string
  workspaceId: string
  status: DiscoveryRunDto["status"]
  industry?: string
  market?: string
  periodDays?: number
  resultCount: number
  errorCode?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
  topics: DiscoveredTopic[]
}

export async function createDiscoveryRun(
  apiClient: ApiClient,
  workspaceId: string,
  request: CreateDiscoveryRunRequest,
): Promise<DiscoveryRun> {
  const response = await apiClient.request<DiscoveryRunDto>(
    `/api/v1/workspaces/${workspaceId}/discovery-runs`,
    {
      method: "POST",
      body: JSON.stringify({
        industry: request.industry,
        market: request.market,
        period_days: request.periodDays,
        result_count: request.resultCount,
      }),
    },
  )
  return mapDiscoveryRun(response)
}

export async function getDiscoveryRun(
  apiClient: ApiClient,
  workspaceId: string,
  runId: string,
): Promise<DiscoveryRun> {
  const response = await apiClient.request<DiscoveryRunDto>(
    `/api/v1/workspaces/${workspaceId}/discovery-runs/${runId}`,
  )
  return mapDiscoveryRun(response)
}

export async function addDiscoveredTopicToQueue(
  apiClient: ApiClient,
  workspaceId: string,
  discoveredTopicId: string,
): Promise<Topic> {
  const response = await apiClient.request<AddDiscoveredTopicResponseDto>(
    `/api/v1/workspaces/${workspaceId}/discovered-topics/${discoveredTopicId}:add-to-queue`,
    { method: "POST" },
  )
  return mapTopic(response.topic)
}

function mapDiscoveryRun(dto: DiscoveryRunDto): DiscoveryRun {
  return {
    id: dto.id,
    workspaceId: dto.workspace_id,
    status: dto.status,
    industry: dto.industry ?? undefined,
    market: dto.market ?? undefined,
    periodDays: dto.period_days ?? undefined,
    resultCount: dto.result_count,
    errorCode: dto.error_code ?? undefined,
    errorMessage: dto.error_message ?? undefined,
    createdAt: dto.created_at,
    completedAt: dto.completed_at ?? undefined,
    topics: dto.topics.map(mapDiscoveredTopic),
  }
}

function mapDiscoveredTopic(dto: DiscoveredTopicDto): DiscoveredTopic {
  return {
    id: dto.id,
    title: dto.title,
    opportunityScore: dto.opportunity_score,
    priority: dto.priority,
    searchSignals: mapSignal(dto.search_signals),
    contentGap: mapSignal(dto.content_gap),
    businessRelevance: mapSignal(dto.business_relevance),
    angle: dto.angle ?? "",
    reasoning: dto.reasoning ?? "",
  }
}

function mapSignal(dto: SignalDetailDto): SignalDetail {
  return {
    score: dto.score,
    level: dto.level,
    source: dto.source,
    evidence: dto.evidence,
  }
}
