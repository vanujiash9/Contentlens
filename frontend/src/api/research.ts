import type { ApiClient } from "./client"
import type { Priority } from "@/types/domain"

interface ResearchSourceDto {
  id: string
  title: string
  url: string
  domain: string | null
  rank: number | null
  snippet: string | null
  status: "pending" | "fetched" | "failed"
  extracted_text: string | null
  fetched_at: string | null
}

interface ResearchFindingDto {
  id: string
  claim: string
  finding_type: string
  source_ids: string[]
  metadata: Record<string, unknown>
}

interface ResearchGapDto {
  id: string
  description: string
  recommendation: string | null
}

interface ResearchOpportunityDto {
  score: number
  priority: Priority
  recommendation: string
  metadata: Record<string, unknown>
}

interface TopicResearchAggregateDto {
  sources: ResearchSourceDto[]
  findings: ResearchFindingDto[]
  information_gaps: ResearchGapDto[]
  opportunity: ResearchOpportunityDto | null
}

interface TopicDetailDto {
  research: TopicResearchAggregateDto
}

export interface ResearchSource {
  id: string
  title: string
  url: string
  domain: string
  rank: number | null
  snippet: string
  status: "pending" | "fetched" | "failed"
  extractedText: string
  fetchedAt: string | null
}

export interface ResearchInsight {
  sources: ResearchSource[]
  findings: Record<string, unknown>[]
  gaps: Record<string, unknown>[]
  opportunity: Record<string, unknown> | null
}

export async function getTopicResearch(
  apiClient: ApiClient,
  workspaceId: string,
  topicId: string,
): Promise<ResearchInsight> {
  const response = await apiClient.request<TopicDetailDto>(
    `/api/v1/workspaces/${workspaceId}/topics/${topicId}`,
  )
  return mapResearch(response.research)
}

function mapResearch(dto: TopicResearchAggregateDto): ResearchInsight {
  return {
    sources: dto.sources.map(mapResearchSource),
    findings: dto.findings.map((finding) => ({ ...finding })),
    gaps: dto.information_gaps.map((gap) => ({ ...gap })),
    opportunity: dto.opportunity ? { ...dto.opportunity } : null,
  }
}

function mapResearchSource(dto: ResearchSourceDto): ResearchSource {
  return {
    id: dto.id,
    title: dto.title,
    url: dto.url,
    domain: dto.domain ?? getDomain(dto.url),
    rank: dto.rank,
    snippet: dto.snippet ?? "",
    status: dto.status,
    extractedText: dto.extracted_text ?? "",
    fetchedAt: dto.fetched_at,
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
