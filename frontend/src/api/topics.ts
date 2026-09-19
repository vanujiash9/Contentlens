import type {
  Finding,
  InformationGap,
  Opportunity,
  Priority,
  ResearchPlan,
  SearchQuery,
  Source,
  Topic,
  TopicSource,
} from "@/types/domain"
import type { ApiClient } from "./client"

export interface TopicSummaryDto {
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

interface ResearchPlanDto {
  objective: string
  target_keyword: string
  search_intent: string
  audience: string
  notes: string[]
}

interface SearchQuerySummaryDto {
  id: string
  query: string
  result_count: number
  created_at: string
}

interface ResearchSourceSummaryDto {
  id: string
  query_id: string | null
  title: string
  url: string
  domain: string | null
  rank: number | null
  snippet: string | null
  status: "pending" | "fetched" | "failed"
  extracted_text: string | null
  error_message: string | null
  created_at: string
  fetched_at: string | null
}

interface ResearchFindingSummaryDto {
  id: string
  claim: string
  finding_type: string
  source_ids: string[]
  metadata: Record<string, unknown>
  created_at: string
}

interface InformationGapSummaryDto {
  id: string
  description: string
  recommendation: string | null
  created_at: string
}

interface OpportunitySummaryDto {
  score: number
  priority: Priority
  recommendation: string
  metadata: Record<string, unknown>
}

interface TopicResearchAggregateDto {
  plan: ResearchPlanDto | null
  queries: SearchQuerySummaryDto[]
  sources: ResearchSourceSummaryDto[]
  findings: ResearchFindingSummaryDto[]
  information_gaps: InformationGapSummaryDto[]
  opportunity: OpportunitySummaryDto | null
}

interface TopicDetailDto {
  topic: TopicSummaryDto
  research: TopicResearchAggregateDto
}

interface TopicListDto {
  topics: TopicSummaryDto[]
}

export function mapTopic(dto: TopicSummaryDto): Topic {
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

export async function getTopicDetail(
  apiClient: ApiClient,
  workspaceId: string,
  topicId: string,
): Promise<Topic> {
  const response = await apiClient.request<TopicDetailDto>(
    `/api/v1/workspaces/${workspaceId}/topics/${topicId}`,
  )
  return mapTopicDetail(response)
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

function mapTopicDetail(dto: TopicDetailDto): Topic {
  const topic = mapTopic(dto.topic)
  const research = dto.research

  return {
    ...topic,
    researchPlan: research.plan ? mapResearchPlan(research.plan) : undefined,
    queries: research.queries.map(mapSearchQuery),
    sources: research.sources.map(mapResearchSource),
    findings: research.findings.map(mapResearchFinding),
    gaps: research.information_gaps.map(mapInformationGap),
    opportunity: research.opportunity ? mapOpportunity(research.opportunity) : undefined,
  }
}

function mapResearchPlan(dto: ResearchPlanDto): ResearchPlan {
  return {
    objective: dto.objective,
    questions: [dto.target_keyword, dto.search_intent, ...dto.notes].filter(Boolean),
    approach: dto.audience,
  }
}

function mapSearchQuery(dto: SearchQuerySummaryDto): SearchQuery {
  return {
    id: dto.id,
    query: dto.query,
    resultsCount: dto.result_count,
    status: "completed",
  }
}

function mapResearchSource(dto: ResearchSourceSummaryDto): Source {
  return {
    id: dto.id,
    url: dto.url,
    title: dto.title,
    domain: dto.domain ?? getDomain(dto.url),
    type: "article",
    relevance: dto.status === "fetched" ? 80 : 0,
    extractedInfo: dto.extracted_text ?? dto.snippet ?? dto.error_message ?? "",
  }
}

function mapResearchFinding(dto: ResearchFindingSummaryDto): Finding {
  return {
    id: dto.id,
    claim: dto.claim,
    confidence: mapConfidence(dto.finding_type),
    sources: dto.source_ids,
  }
}

function mapInformationGap(dto: InformationGapSummaryDto): InformationGap {
  return {
    id: dto.id,
    title: dto.recommendation ?? "Khoảng trống thông tin",
    description: dto.description,
    importance: "medium",
    evidence: dto.recommendation ?? "",
  }
}

function mapOpportunity(dto: OpportunitySummaryDto): Opportunity {
  return {
    score: dto.score,
    priority: dto.priority,
    recommendation: dto.recommendation,
    angle: String(dto.metadata.angle ?? ""),
    audience: String(dto.metadata.audience ?? ""),
    reasons: Array.isArray(dto.metadata.reasons) ? dto.metadata.reasons.map(String) : [],
    breakdown: Array.isArray(dto.metadata.breakdown)
      ? dto.metadata.breakdown.map(mapBreakdownItem)
      : [],
  }
}

function mapBreakdownItem(item: unknown): { label: string; score: number } {
  if (typeof item === "object" && item !== null) {
    const record = item as Record<string, unknown>
    return {
      label: String(record.label ?? "Tín hiệu"),
      score: Number(record.score ?? 0),
    }
  }

  return { label: String(item), score: 0 }
}

function mapConfidence(findingType: string): Finding["confidence"] {
  if (findingType === "high" || findingType === "medium" || findingType === "low") {
    return findingType
  }

  return "medium"
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
