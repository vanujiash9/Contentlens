import type { BriefSummary } from "./briefs"
import type { ApiClient } from "./client"

export interface GenerateBriefAgentInput {
  topicId: string
  industry: string
  market: string
  audience: string
  searchIntent: string
  angle: string
  businessGoal: string
  researchInsights: string
}

interface GenerateBriefAgentResponseDto {
  action: "generate_brief"
  result: unknown
}

export async function generateBriefWithAgent(
  apiClient: ApiClient,
  workspaceId: string,
  input: GenerateBriefAgentInput,
): Promise<BriefSummary> {
  const response = await apiClient.request<GenerateBriefAgentResponseDto>(
    `/api/v1/workspaces/${workspaceId}/agent/actions`,
    {
      method: "POST",
      body: JSON.stringify({
        action: "generate_brief",
        input: {
          topic_id: input.topicId,
          industry: input.industry,
          market: input.market,
          audience: input.audience,
          search_intent: input.searchIntent,
          angle: input.angle,
          business_goal: input.businessGoal,
          research_insights: input.researchInsights,
        },
      }),
    },
  )

  return mapAgentBriefResult(response.result)
}

function mapAgentBriefResult(result: unknown): BriefSummary {
  const dto = result as {
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
    outline: dto.outline.map((item) => {
      if (typeof item === "object" && item !== null) {
        const record = item as Record<string, unknown>
        return {
          section: String(record.section ?? record.heading ?? record.title ?? "Phần nội dung"),
          description: String(record.description ?? record.summary ?? ""),
        }
      }
      return { section: String(item), description: "" }
    }),
    keyFacts: dto.key_facts.map(String),
    draft: dto.draft ?? "",
    mustCover: dto.must_cover.map(String),
    mustAvoid: dto.must_avoid.map(String),
    evidenceMap: dto.evidence_map.map((item) => {
      if (typeof item === "object" && item !== null) {
        const record = item as Record<string, unknown>
        const claimIds = record.claimIds ?? record.claim_ids ?? []
        return {
          section: String(record.section ?? record.claim ?? "Evidence"),
          claimIds: Array.isArray(claimIds) ? claimIds.map(String) : [],
        }
      }
      return { section: String(item), claimIds: [] }
    }),
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
