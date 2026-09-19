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
  must_cover: unknown[]
  must_avoid: unknown[]
  evidence_map: unknown[]
  review_status: string
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
  createdAt: string
  updatedAt: string
  version: number
}

export async function listBriefs(apiClient: ApiClient, workspaceId: string): Promise<BriefSummary[]> {
  const response = await apiClient.request<BriefListDto>(`/api/v1/workspaces/${workspaceId}/briefs`)
  return response.briefs.map(mapBrief)
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
    draft: "",
    mustCover: dto.must_cover.map(String),
    mustAvoid: dto.must_avoid.map(String),
    evidenceMap: dto.evidence_map.map(mapEvidenceItem),
    contentQuality: {
      wordCount: 0,
      sourcesUsed: 0,
      totalClaims: 0,
      citedClaims: 0,
      checks: dto.quality_checks.map((check) => ({ label: String(check), ok: true })),
      warnings: dto.quality_warnings.map(String),
    },
    reviewStatus: dto.review_status,
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
