export type TopicStatus = "pending" | "processing" | "completed" | "failed"
export type Priority = "high" | "medium" | "low"
export type TopicSource = "user" | "ai"

export interface Source {
  id: string
  url: string
  title: string
  domain: string
  type: "official" | "review" | "article" | "forum" | "product" | "comparison"
  relevance: number
  publishedDate?: string
  extractedInfo: string
}

export interface SearchQuery {
  id: string
  query: string
  resultsCount: number
  status: "completed" | "pending"
}

export interface Finding {
  id: string
  claim: string
  confidence: "high" | "medium" | "low"
  sources: string[]
}

export interface InformationGap {
  id: string
  title: string
  description: string
  importance: "high" | "medium" | "low"
  evidence: string
}

export interface Opportunity {
  score: number
  priority: Priority
  recommendation: string
  angle: string
  audience: string
  reasons: string[]
  breakdown: { label: string; score: number }[]
}

export interface QualityCheck {
  label: string
  ok: boolean
}

export interface ContentQuality {
  wordCount: number
  sourcesUsed: number
  totalClaims: number
  citedClaims: number
  checks: QualityCheck[]
  warnings: string[]
}

export interface ContentBrief {
  title: string
  searchIntent: string
  targetAudience: string
  objective: string
  angle: string
  keyQuestions: string[]
  outline: { section: string; description: string }[]
  keyFacts: string[]
  draft: string
  mustCover?: string[]
  mustAvoid?: string[]
  evidenceMap?: { section: string; claimIds: string[] }[]
  contentQuality?: ContentQuality
  approvedAt?: string
}

export interface ResearchPlan {
  objective: string
  questions: string[]
  approach: string
}

export interface Topic {
  id: string
  title: string
  status: TopicStatus
  source?: TopicSource
  opportunityScore?: number
  priority?: Priority
  createdAt: string
  updatedAt: string
  completedAt?: string
  researchPlan?: ResearchPlan
  queries?: SearchQuery[]
  sources?: Source[]
  findings?: Finding[]
  gaps?: InformationGap[]
  opportunity?: Opportunity
  brief?: ContentBrief
  researchProgress?: number
  currentStep?: string
}

export interface SignalDetail {
  score: number
  level: "high" | "medium" | "low"
  source: string
  evidence: string
}

export interface DiscoveredTopic {
  id: string
  title: string
  opportunityScore: number
  priority: Priority
  searchSignals: SignalDetail
  contentGap: SignalDetail
  businessRelevance: SignalDetail
  angle: string
  reasoning: string
  addedToQueueAt?: string
  topicId?: string
}
