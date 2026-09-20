import type { ContentBrief } from "@/types/domain"
import type { ApiClient } from "./client"

interface BriefSummaryDto {
  id: string
  workspace_id: string
  topic_id: string
  title: string
  search_intent: string | null
  target_audience: string | null
  objective: string | null
  angle: string | null
  key_questions: unknown[]
  outline: unknown[]
  key_facts: unknown[]
  draft: string | null
  must_cover: unknown[]
  must_avoid: unknown[]
  evidence_map: unknown[]
  review_status: string
  approved_at: string | null
  word_count: number
  sources_used: number
  total_claims: number
  cited_claims: number
  quality_checks: unknown[]
  quality_warnings: unknown[]
  created_at: string
  updated_at: string
  version: number
}

interface BriefListDto {
  briefs: BriefSummaryDto[]
}

export interface BriefSummary extends ContentBrief {
  id: string
  workspaceId: string
  topicId: string
  reviewStatus: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface GenerateBriefInput {
  topicId: string
  industry: string
  market: string
  audience: string
  searchIntent: string
  angle: string
  businessGoal: string
  researchInsights: string
}

export async function listBriefs(apiClient: ApiClient, workspaceId: string): Promise<BriefSummary[]> {
  const response = await apiClient.request<BriefListDto>(`/api/v1/workspaces/${workspaceId}/briefs`)
  return response.briefs.map(mapBrief)
}

export async function generateBrief(
  apiClient: ApiClient,
  workspaceId: string,
  input: GenerateBriefInput,
): Promise<BriefSummary> {
  const response = await apiClient.request<BriefSummaryDto>(
    `/api/v1/workspaces/${workspaceId}/briefs:generate`,
    {
      method: "POST",
      body: JSON.stringify({
        topic_id: input.topicId,
        industry: input.industry,
        market: input.market,
        audience: input.audience,
        search_intent: input.searchIntent,
        angle: input.angle,
        business_goal: input.businessGoal,
        research_insights: input.researchInsights,
      }),
    },
  )
  return mapBrief(response)
}

export async function getBrief(
  apiClient: ApiClient,
  workspaceId: string,
  briefId: string,
): Promise<BriefSummary> {
  const response = await apiClient.request<BriefSummaryDto>(
    `/api/v1/workspaces/${workspaceId}/briefs/${briefId}`,
  )
  return mapBrief(response)
}

export async function deleteBrief(
  apiClient: ApiClient,
  workspaceId: string,
  briefId: string,
): Promise<void> {
  await apiClient.request<void>(`/api/v1/workspaces/${workspaceId}/briefs/${briefId}`, {
    method: "DELETE",
  })
}

export async function saveBriefDraft(
  apiClient: ApiClient,
  workspaceId: string,
  briefId: string,
  draft: string,
  expectedVersion?: number,
): Promise<BriefSummary> {
  const response = await apiClient.request<BriefSummaryDto>(
    `/api/v1/workspaces/${workspaceId}/briefs/${briefId}/draft`,
    {
      method: "PATCH",
      body: JSON.stringify({ draft, expected_version: expectedVersion }),
    },
  )
  return mapBrief(response)
}

export async function approveBrief(
  apiClient: ApiClient,
  workspaceId: string,
  briefId: string,
): Promise<BriefSummary> {
  const response = await apiClient.request<BriefSummaryDto>(
    `/api/v1/workspaces/${workspaceId}/briefs/${briefId}:approve`,
    { method: "POST" },
  )
  return mapBrief(response)
}

export async function requestBriefRevision(
  apiClient: ApiClient,
  workspaceId: string,
  briefId: string,
  request: string,
  expectedVersion?: number,
): Promise<BriefSummary> {
  const response = await apiClient.request<BriefSummaryDto>(
    `/api/v1/workspaces/${workspaceId}/briefs/${briefId}/revisions`,
    {
      method: "POST",
      body: JSON.stringify({ request, expected_version: expectedVersion }),
    },
  )
  return mapBrief(response)
}

function mapBrief(dto: BriefSummaryDto): BriefSummary {
  return {
    id: dto.id,
    workspaceId: dto.workspace_id,
    topicId: dto.topic_id,
    title: dto.title,
    searchIntent: dto.search_intent ?? "",
    targetAudience: dto.target_audience ?? "",
    objective: dto.objective ?? "",
    angle: dto.angle ?? "",
    keyQuestions: dto.key_questions.map(String),
    outline: dto.outline.map(mapOutlineItem),
    keyFacts: dto.key_facts.map(String),
    draft: dto.draft ?? "",
    mustCover: dto.must_cover.map(String),
    mustAvoid: dto.must_avoid.map(String),
    evidenceMap: dto.evidence_map.map(mapEvidenceItem),
    contentQuality: {
      wordCount: dto.word_count,
      sourcesUsed: dto.sources_used,
      totalClaims: dto.total_claims,
      citedClaims: dto.cited_claims,
      checks: dto.quality_checks.map((check) => ({ label: String(check), ok: true })),
      warnings: dto.quality_warnings.map(String),
    },
    reviewStatus: dto.review_status,
    approvedAt: dto.approved_at ?? undefined,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    version: dto.version,
  }
}

function mapOutlineItem(item: unknown): { section: string; description: string } {
  if (typeof item === "object" && item !== null) {
    const record = item as Record<string, unknown>
    const section = record.section ?? record.heading ?? record.title ?? "Phần nội dung"
    const description = record.description ?? record.summary ?? record.points ?? ""
    return {
      section: String(section),
      description: Array.isArray(description) ? description.map(String).join("; ") : String(description),
    }
  }

  return { section: String(item), description: "" }
}

function mapEvidenceItem(item: unknown): { section: string; claimIds: string[] } {
  if (typeof item === "object" && item !== null) {
    const record = item as Record<string, unknown>
    const section = record.section ?? record.claim ?? "Evidence"
    const claimIds = record.claimIds ?? record.claim_ids ?? []
    return {
      section: String(section),
      claimIds: Array.isArray(claimIds) ? claimIds.map(String) : [],
    }
  }

  return { section: String(item), claimIds: [] }
}
