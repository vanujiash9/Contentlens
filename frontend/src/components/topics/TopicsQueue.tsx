import { useState, type ReactNode } from "react"
import { generateBrief } from "../../api/briefs"
import type { ApiClient } from "../../api/client"
import { getErrorMessage } from "../../api/errors"
import { getTopicResearch, type ResearchInsight, type ResearchSource } from "../../api/research"
import { deleteTopic, retryTopic, startTopic } from "../../api/topics"
import { useIsMobile } from "../../hooks/useIsMobile"
import type { Topic } from "../../types/domain"
import PageShell from "../ui/PageShell"
import s from "./TopicsQueue.module.css"

interface TopicsQueueProps {
  apiClient: ApiClient
  workspaceId: string
  onNavigate: (view: string) => void
  topics: Topic[]
  isLoading?: boolean
  error?: string | null
  onTopicChange?: (topic: Topic) => void
  onTopicDelete?: (topicId: string) => void
}

interface CompetitorSummary {
  title: string
  url: string
  domain: string
  rank: number | null
}

interface CrossSerpSummary {
  commonPatterns: string[]
  contentGaps: string[]
  weakAreas: string[]
  informationGain: string[]
}

interface ResearchResultPanelProps {
  topic: Topic
  research: ResearchInsight | null
  isLoading: boolean
  error: string | null
  isGeneratingBrief: boolean
  onCreateBrief: () => void
  onClose: () => void
}

const FILTERS: { value: Topic["status"] | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ nghiên cứu" },
  { value: "processing", label: "Đang nghiên cứu" },
  { value: "completed", label: "Đã nghiên cứu" },
  { value: "failed", label: "Lỗi" },
]

const STATUS_LABELS: Record<Topic["status"], string> = {
  pending: "Chờ xử lý",
  processing: "Đang nghiên cứu",
  completed: "Hoàn thành",
  failed: "Thất bại",
}

const STATUS_CLASSES: Record<Topic["status"], string> = {
  pending: s.statusPending,
  processing: s.statusProcessing,
  completed: s.statusCompleted,
  failed: s.statusFailed,
}

const RESEARCH_RUNNING_STEP = "Đang tìm kiếm và đọc nguồn cạnh tranh"

function StatusBadge({ status }: { status: Topic["status"] }) {
  return <span className={`${s.statusBadge} ${STATUS_CLASSES[status]}`}>{STATUS_LABELS[status]}</span>
}

function Progress({ topic }: { topic: Topic }) {
  if (topic.status === "processing" && topic.researchProgress !== undefined) {
    return (
      <div className={s.progressBlock}>
        <div className={s.progressTrack}>
          <div className={s.progressFill} style={{ width: `${topic.researchProgress}%` }} />
        </div>
        <span className={s.progressText}>{topic.researchProgress}%</span>
      </div>
    )
  }

  if (topic.status === "completed") {
    return <span className={s.doneText}>Đã xong</span>
  }

  return <span className={s.emptyValue}>—</span>
}

export default function TopicsQueue({
  apiClient,
  workspaceId,
  onNavigate,
  topics,
  isLoading = false,
  error = null,
  onTopicChange,
  onTopicDelete,
}: TopicsQueueProps) {
  const isMobile = useIsMobile()
  const [filter, setFilter] = useState<Topic["status"] | "all">("all")
  const [search, setSearch] = useState("")
  const [generatingBriefIds, setGeneratingBriefIds] = useState<Set<string>>(new Set())
  const [researchingTopicIds, setResearchingTopicIds] = useState<Set<string>>(new Set())
  const [deletingTopicIds, setDeletingTopicIds] = useState<Set<string>>(new Set())
  const [selectedResearchTopicId, setSelectedResearchTopicId] = useState<string | null>(null)
  const [researchByTopicId, setResearchByTopicId] = useState<Record<string, ResearchInsight>>({})
  const [loadingResearchTopicIds, setLoadingResearchTopicIds] = useState<Set<string>>(new Set())
  const [researchResultError, setResearchResultError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const allTopics = topics
  const selectedResearchTopic = selectedResearchTopicId
    ? allTopics.find((topic) => topic.id === selectedResearchTopicId)
    : undefined

  const filtered = allTopics.filter((topic) => {
    const matchFilter = filter === "all" || topic.status === filter
    const matchSearch = topic.title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const loadResearchResult = async (topic: Topic) => {
    if (workspaceId.length === 0) {
      return
    }

    setSelectedResearchTopicId(topic.id)
    setResearchResultError(null)
    if (researchByTopicId[topic.id] || loadingResearchTopicIds.has(topic.id)) {
      return
    }

    const existingResearch = buildResearchFromTopic(topic)
    if (existingResearch !== null) {
      setResearchByTopicId((current) => ({ ...current, [topic.id]: existingResearch }))
      return
    }

    setLoadingResearchTopicIds((current) => new Set([...current, topic.id]))
    try {
      const research = await getTopicResearch(apiClient, workspaceId, topic.id)
      setResearchByTopicId((current) => ({ ...current, [topic.id]: research }))
    } catch (researchError: unknown) {
      setResearchResultError(getErrorMessage(researchError))
    } finally {
      setLoadingResearchTopicIds((current) => {
        const next = new Set(current)
        next.delete(topic.id)
        return next
      })
    }
  }

  const handleStartResearch = async (topic: Topic) => {
    if (workspaceId.length === 0 || researchingTopicIds.has(topic.id)) {
      return
    }

    setActionError(null)
    setActionMessage(null)
    setResearchingTopicIds((current) => new Set([...current, topic.id]))
    onTopicChange?.(markTopicResearching(topic))
    try {
      const nextTopic = await startTopic(apiClient, workspaceId, topic.id)
      onTopicChange?.(nextTopic)
      setActionMessage("Đã nghiên cứu xong. Xem Research Result trước khi tạo brief.")
      await loadResearchResult(nextTopic)
    } catch (researchError: unknown) {
      const message = getErrorMessage(researchError)
      onTopicChange?.(markTopicFailed(topic, message))
      setActionError(message)
    } finally {
      setResearchingTopicIds((current) => {
        const next = new Set(current)
        next.delete(topic.id)
        return next
      })
    }
  }

  const handleRetryResearch = async (topic: Topic) => {
    if (workspaceId.length === 0 || researchingTopicIds.has(topic.id)) {
      return
    }

    setActionError(null)
    setActionMessage(null)
    setResearchingTopicIds((current) => new Set([...current, topic.id]))
    onTopicChange?.(markTopicResearching(topic))
    try {
      const nextTopic = await retryTopic(apiClient, workspaceId, topic.id)
      onTopicChange?.(nextTopic)
      setActionMessage("Đã nghiên cứu lại. Xem Research Result trước khi tạo brief.")
      setResearchByTopicId((current) => {
        const next = { ...current }
        delete next[topic.id]
        return next
      })
      await loadResearchResult(nextTopic)
    } catch (researchError: unknown) {
      const message = getErrorMessage(researchError)
      onTopicChange?.(markTopicFailed(topic, message))
      setActionError(message)
    } finally {
      setResearchingTopicIds((current) => {
        const next = new Set(current)
        next.delete(topic.id)
        return next
      })
    }
  }

  const handleDeleteTopic = async (topic: Topic) => {
    if (workspaceId.length === 0 || topic.status === "processing" || deletingTopicIds.has(topic.id)) {
      return
    }

    const confirmed = window.confirm(`Xóa chủ đề “${topic.title}”?`)
    if (!confirmed) {
      return
    }

    setActionError(null)
    setActionMessage(null)
    setDeletingTopicIds((current) => new Set([...current, topic.id]))
    try {
      await deleteTopic(apiClient, workspaceId, topic.id)
      onTopicDelete?.(topic.id)
      if (selectedResearchTopicId === topic.id) {
        setSelectedResearchTopicId(null)
      }
      setActionMessage(`Đã xóa chủ đề “${topic.title}”.`)
    } catch (deleteError: unknown) {
      setActionError(getErrorMessage(deleteError))
    } finally {
      setDeletingTopicIds((current) => {
        const next = new Set(current)
        next.delete(topic.id)
        return next
      })
    }
  }

  const handleGenerateBrief = async (topic: Topic) => {
    if (workspaceId.length === 0 || generatingBriefIds.has(topic.id)) {
      return
    }

    setActionError(null)
    setActionMessage(null)
    setGeneratingBriefIds((current) => new Set([...current, topic.id]))

    try {
      await generateBrief(apiClient, workspaceId, {
        topicId: topic.id,
        industry: "Piano & nhạc cụ phím",
        market: "Việt Nam",
        audience: "Người đang tìm hiểu chủ đề này",
        searchIntent: `Tìm hiểu và ra quyết định về ${topic.title}`,
        angle: topic.priority === "high" ? "Tập trung vào nhu cầu mua hàng có tín hiệu cao" : "Hướng dẫn thực tế theo nhu cầu người đọc",
        businessGoal: "Tạo nội dung có khả năng hỗ trợ tư vấn và chuyển đổi khách hàng",
        researchInsights: buildResearchInsights(topic),
      })
      setActionMessage(`Đã tạo brief cho “${topic.title}”.`)
      onNavigate("briefs")
    } catch (generateError: unknown) {
      setActionError(getErrorMessage(generateError))
    } finally {
      setGeneratingBriefIds((current) => {
        const next = new Set(current)
        next.delete(topic.id)
        return next
      })
    }
  }

  const headerActions = (
    <div className={s.headerActions}>
      <button className={s.secondaryBtn} onClick={() => onNavigate("discovery")}>
        Khám phá topic
      </button>
      <button className={s.primaryBtn} onClick={() => onNavigate("add-topics")}>
        + Thêm chủ đề
      </button>
    </div>
  )

  return (
    <PageShell
      title="Hàng đợi nghiên cứu"
      subtitle={`${allTopics.length} chủ đề · ${pendingCount(allTopics)} chờ nghiên cứu · ${processingCount(allTopics)} đang nghiên cứu`}
      actions={!isMobile ? headerActions : undefined}
    >
      <div className={s.flowHint}>Workflow: Bắt đầu nghiên cứu → Research Result → Tạo Content Brief</div>
      {isLoading && allTopics.length === 0 ? <div className={s.emptyState}>Đang tải chủ đề...</div> : null}
      {isLoading && allTopics.length > 0 ? <div className={s.refreshNotice}>Đang cập nhật hàng đợi...</div> : null}
      {error ? <div className={s.emptyState}>{error}</div> : null}
      {actionError ? <div className={s.emptyState}>{actionError}</div> : null}
      {actionMessage ? <div className={s.emptyState}>{actionMessage}</div> : null}

      {selectedResearchTopic ? (
        <ResearchResultPanel
          topic={selectedResearchTopic}
          research={researchByTopicId[selectedResearchTopic.id] ?? null}
          isLoading={loadingResearchTopicIds.has(selectedResearchTopic.id)}
          error={researchResultError}
          isGeneratingBrief={generatingBriefIds.has(selectedResearchTopic.id)}
          onCreateBrief={() => void handleGenerateBrief(selectedResearchTopic)}
          onClose={() => setSelectedResearchTopicId(null)}
        />
      ) : null}

      <div className={s.controlsRow}>
        <input
          type="text"
          placeholder="Tìm kiếm chủ đề..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={s.searchInput}
        />
        <div className={s.filterBtnRow}>
          {FILTERS.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`${s.filterBtn} ${filter === item.value ? s.filterBtnActive : ""}`}
            >
              {item.label} <span className={s.filterCount}>{countForFilter(allTopics, item.value)}</span>
            </button>
          ))}
        </div>
      </div>

      {isMobile ? (
        <div className={s.mobileList}>
          {filtered.length === 0 ? (
            <EmptyState onAdd={() => onNavigate("add-topics")} />
          ) : (
            filtered.map((topic) => (
              <article key={topic.id} className={s.mobileCard}>
                <div className={s.mobileCardTop}>
                  <button
                    type="button"
                    className={s.topicButton}
                    disabled={topic.status !== "completed"}
                    onClick={() => void loadResearchResult(topic)}
                  >
                    {topic.title}
                  </button>
                  {topic.opportunityScore !== undefined ? <span className={s.score}>{topic.opportunityScore}</span> : null}
                </div>

                <div className={s.mobileMetaRow}>
                  <StatusBadge status={topic.status} />
                  {topic.status === "processing" && topic.currentStep ? <span className={s.currentStep}>{topic.currentStep}</span> : null}
                </div>

                <Progress topic={topic} />
                <TopicActions
                  topic={topic}
                  isGeneratingBrief={generatingBriefIds.has(topic.id)}
                  isResearching={researchingTopicIds.has(topic.id)}
                  isDeleting={deletingTopicIds.has(topic.id)}
                  onOpen={() => void loadResearchResult(topic)}
                  onGenerateBrief={() => void handleGenerateBrief(topic)}
                  onStartResearch={() => void handleStartResearch(topic)}
                  onRetryResearch={() => void handleRetryResearch(topic)}
                  onDelete={() => void handleDeleteTopic(topic)}
                />
              </article>
            ))
          )}

          <button className={s.mobileAddBtn} onClick={() => onNavigate("add-topics")}>
            + Thêm chủ đề
          </button>
        </div>
      ) : (
        <div className={s.tableContainer}>
          <div className={s.tableHeader}>
            {["Chủ đề", "Trạng thái", "Tiến độ", "Cơ hội", "Ngày tạo", "Hành động"].map((label) => (
              <div key={label} className={s.tableHeaderCell}>
                {label}
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState onAdd={() => onNavigate("add-topics")} />
          ) : (
            filtered.map((topic) => (
              <div key={topic.id} className={s.tableRow}>
                <div className={s.topicCellWrap}>
                  <button
                    type="button"
                    className={s.topicButton}
                    disabled={topic.status !== "completed"}
                    onClick={() => void loadResearchResult(topic)}
                  >
                    {topic.title}
                  </button>
                  {topic.status === "processing" && topic.currentStep ? <span className={s.currentStep}>{topic.currentStep}</span> : null}
                </div>
                <div>
                  <StatusBadge status={topic.status} />
                </div>
                <Progress topic={topic} />
                <div>
                  {topic.opportunityScore !== undefined ? (
                    <span className={s.score}>
                      {topic.opportunityScore}<span>/100</span>
                    </span>
                  ) : (
                    <span className={s.emptyValue}>—</span>
                  )}
                </div>
                <time className={s.dateText}>{new Date(topic.createdAt).toLocaleDateString("vi-VN")}</time>
                <TopicActions
                  topic={topic}
                  isGeneratingBrief={generatingBriefIds.has(topic.id)}
                  isResearching={researchingTopicIds.has(topic.id)}
                  isDeleting={deletingTopicIds.has(topic.id)}
                  onOpen={() => void loadResearchResult(topic)}
                  onGenerateBrief={() => void handleGenerateBrief(topic)}
                  onStartResearch={() => void handleStartResearch(topic)}
                  onRetryResearch={() => void handleRetryResearch(topic)}
                  onDelete={() => void handleDeleteTopic(topic)}
                />
              </div>
            ))
          )}
        </div>
      )}
    </PageShell>
  )
}

function ResearchResultPanel({
  topic,
  research,
  isLoading,
  error,
  isGeneratingBrief,
  onCreateBrief,
  onClose,
}: ResearchResultPanelProps) {
  const crossSerp = research ? getCrossSerpSummary(research.opportunity) : emptyCrossSerpSummary()
  const competitors = research ? getCompetitors(research) : []
  const fallbackGaps = research?.gaps.map((gap) => String(gap.description ?? "")).filter(Boolean) ?? []
  const fallbackFindings = research?.findings.map((finding) => String(finding.claim ?? "")).filter(Boolean) ?? []
  const contentGaps = crossSerp.contentGaps.length > 0 ? crossSerp.contentGaps : fallbackGaps
  const commonPatterns = crossSerp.commonPatterns.length > 0 ? crossSerp.commonPatterns : fallbackFindings
  const informationGain = crossSerp.informationGain.length > 0 ? crossSerp.informationGain : getOpportunityRecommendation(research?.opportunity)

  return (
    <section className={s.researchPanel} aria-live="polite">
      <div className={s.researchPanelHeader}>
        <div>
          <span className={s.researchEyebrow}>Research Result</span>
          <h2>{topic.title}</h2>
          <p>Xem phân tích SERP và competitor trước khi tạo Content Brief.</p>
        </div>
        <button type="button" className={s.secondaryBtn} onClick={onClose}>
          Đóng
        </button>
      </div>

      {isLoading ? <div className={s.researchNotice}>Đang tải Research Result...</div> : null}
      {error ? <div className={s.researchError}>{error}</div> : null}

      {research ? (
        <>
          <div className={s.researchMetrics}>
            <MetricCard label="Competitor đã phân tích" value={String(competitors.length)} />
            <MetricCard label="Nguồn SERP" value={String(research.sources.length)} />
            <MetricCard label="Content gaps" value={String(contentGaps.length)} />
          </div>

          <div className={s.researchGrid}>
            <ResearchSection title="Nguồn Tavily / Competitor đã phân tích">
              {competitors.length > 0 ? (
                <ol className={s.competitorList}>
                  {competitors.map((competitor) => (
                    <li key={`${competitor.url}-${competitor.rank ?? "rank"}`}>
                      <span className={s.rankBadge}>#{competitor.rank ?? "?"}</span>
                      <div>
                        <strong>{competitor.title}</strong>
                        <a href={competitor.url} target="_blank" rel="noreferrer">
                          {competitor.domain}
                        </a>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyResearchText text="Chưa có competitor được phân tích." />
              )}
            </ResearchSection>

            <ResearchSection title="SERP insights / common patterns">
              <InsightList items={commonPatterns} emptyText="Chưa có SERP pattern rõ ràng." />
            </ResearchSection>

            <ResearchSection title="Content gaps">
              <InsightList items={contentGaps} emptyText="Chưa có content gap rõ ràng." />
            </ResearchSection>

            <ResearchSection title="Weak / unanswered areas">
              <InsightList items={crossSerp.weakAreas} emptyText="Chưa có weak/unanswered area rõ ràng." />
            </ResearchSection>

            <ResearchSection title="Recommended information gain">
              <InsightList items={informationGain} emptyText="Chưa có khuyến nghị information gain." />
            </ResearchSection>
          </div>

          <div className={s.researchCtaRow}>
            <button className={s.primaryBtn} onClick={onCreateBrief} disabled={isGeneratingBrief}>
              {isGeneratingBrief ? "Đang tạo Content Brief..." : "Tạo Content Brief"}
            </button>
            <span>Brief sẽ dùng structured research này để tạo outline/draft.</span>
          </div>
        </>
      ) : null}
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.researchMetric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ResearchSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={s.researchSection}>
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function InsightList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (items.length === 0) {
    return <EmptyResearchText text={emptyText} />
  }

  return (
    <ul className={s.insightList}>
      {items.slice(0, 8).map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function EmptyResearchText({ text }: { text: string }) {
  return <p className={s.researchEmptyText}>{text}</p>
}

function markTopicResearching(topic: Topic): Topic {
  return {
    ...topic,
    status: "processing",
    researchProgress: Math.max(topic.researchProgress ?? 0, 10),
    currentStep: topic.currentStep ?? RESEARCH_RUNNING_STEP,
  }
}

function markTopicFailed(topic: Topic, message: string): Topic {
  return {
    ...topic,
    status: "failed",
    currentStep: message,
  }
}

function pendingCount(topics: Topic[]) {
  return topics.filter((topic) => topic.status === "pending").length
}

function processingCount(topics: Topic[]) {
  return topics.filter((topic) => topic.status === "processing").length
}

function countForFilter(topics: Topic[], filter: Topic["status"] | "all"): number {
  if (filter === "all") {
    return topics.length
  }

  return topics.filter((topic) => topic.status === filter).length
}

function buildResearchInsights(topic: Topic): string {
  const parts = [
    `Chủ đề: ${topic.title}`,
    topic.opportunityScore !== undefined ? `Điểm cơ hội: ${topic.opportunityScore}/100` : "Chưa có điểm cơ hội",
    topic.priority !== undefined ? `Mức ưu tiên: ${topic.priority}` : "Chưa có mức ưu tiên",
  ]

  if (topic.researchPlan) {
    parts.push(`Mục tiêu nghiên cứu: ${topic.researchPlan.objective}`)
    parts.push(`Cách tiếp cận: ${topic.researchPlan.approach}`)
  }

  if (topic.findings?.length) {
    parts.push("Phát hiện chính:")
    topic.findings.slice(0, 6).forEach((finding) => {
      parts.push(`- ${finding.claim}`)
    })
  }

  if (topic.sources?.length) {
    parts.push("Nguồn tham khảo:")
    topic.sources.slice(0, 6).forEach((source) => {
      parts.push(`- ${source.title} (${source.domain}): ${source.extractedInfo}`)
    })
  }

  if (topic.gaps?.length) {
    parts.push("Khoảng trống nội dung:")
    topic.gaps.slice(0, 4).forEach((gap) => {
      parts.push(`- ${gap.description}`)
    })
  }

  if (topic.opportunity) {
    parts.push(`Khuyến nghị cơ hội: ${topic.opportunity.recommendation}`)
  }

  return parts.join("\n")
}

function buildResearchFromTopic(topic: Topic): ResearchInsight | null {
  if (!topic.sources?.length && !topic.findings?.length && !topic.gaps?.length && !topic.opportunity) {
    return null
  }

  return {
    sources:
      topic.sources?.map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
        domain: source.domain,
        rank: null,
        snippet: source.extractedInfo,
        status: source.relevance > 0 ? "fetched" : "failed",
        extractedText: source.extractedInfo,
        fetchedAt: null,
      })) ?? [],
    findings:
      topic.findings?.map((finding) => ({
        id: finding.id,
        claim: finding.claim,
        finding_type: finding.confidence,
        source_ids: finding.sources,
        metadata: {},
      })) ?? [],
    gaps:
      topic.gaps?.map((gap) => ({
        id: gap.id,
        description: gap.description,
        recommendation: gap.evidence || gap.title,
      })) ?? [],
    opportunity: topic.opportunity
      ? {
          score: topic.opportunity.score,
          priority: topic.opportunity.priority,
          recommendation: topic.opportunity.recommendation,
          metadata: {
            angle: topic.opportunity.angle,
            audience: topic.opportunity.audience,
            reasons: topic.opportunity.reasons,
            breakdown: topic.opportunity.breakdown,
          },
        }
      : null,
  }
}

function getCompetitors(research: ResearchInsight): CompetitorSummary[] {
  const competitorAnalysis = getCompetitorAnalysis(research.opportunity)
  if (competitorAnalysis.length > 0) {
    return competitorAnalysis
  }

  return research.sources.map((source) => sourceToCompetitor(source))
}

function getCompetitorAnalysis(opportunity: Record<string, unknown> | null): CompetitorSummary[] {
  const crossMetadata = getMetadata(opportunity)
  const competitors = crossMetadata.competitor_analysis
  if (!Array.isArray(competitors)) {
    return []
  }

  return competitors.map(mapCompetitor).filter((competitor): competitor is CompetitorSummary => competitor !== null)
}

function mapCompetitor(value: unknown): CompetitorSummary | null {
  if (!isRecord(value)) {
    return null
  }

  const url = getString(value.source_url)
  if (!url) {
    return null
  }

  return {
    title: getString(value.source_title) || getDomain(url),
    url,
    domain: getDomain(url),
    rank: getNumber(value.rank),
  }
}

function sourceToCompetitor(source: ResearchSource): CompetitorSummary {
  return {
    title: source.title,
    url: source.url,
    domain: source.domain || getDomain(source.url),
    rank: source.rank,
  }
}

function getCrossSerpSummary(opportunity: Record<string, unknown> | null): CrossSerpSummary {
  const metadata = getMetadata(opportunity)
  const crossSerp = metadata.cross_serp_analysis
  if (!isRecord(crossSerp)) {
    return emptyCrossSerpSummary()
  }

  return {
    commonPatterns: getStringList(crossSerp.common_patterns),
    contentGaps: getStringList(crossSerp.content_gaps),
    weakAreas: [
      ...getStringList(crossSerp.weak_explanations),
      ...getStringList(crossSerp.unanswered_questions),
    ],
    informationGain: [
      ...getStringList(crossSerp.differentiation_opportunities),
      ...getStringList(crossSerp.information_gain_opportunities),
    ],
  }
}

function emptyCrossSerpSummary(): CrossSerpSummary {
  return {
    commonPatterns: [],
    contentGaps: [],
    weakAreas: [],
    informationGain: [],
  }
}

function getOpportunityRecommendation(opportunity: Record<string, unknown> | null | undefined): string[] {
  const recommendation = getString(opportunity?.recommendation)
  return recommendation ? [recommendation] : []
}

function getMetadata(opportunity: Record<string, unknown> | null): Record<string, unknown> {
  if (!opportunity || !isRecord(opportunity.metadata)) {
    return {}
  }
  const breakdown = opportunity.metadata.breakdown
  return {
    ...opportunity.metadata,
    ...extractMetadataFromBreakdown(breakdown),
  }
}

function extractMetadataFromBreakdown(value: unknown): Record<string, unknown> {
  if (!Array.isArray(value)) {
    return {}
  }

  return value.reduce<Record<string, unknown>>((metadata, item) => {
    if (!isRecord(item)) {
      return metadata
    }
    const label = getString(item.label)
    if (label === "competitor_analysis" || label === "cross_serp_analysis") {
      return { ...metadata, [label]: item.data }
    }
    return metadata
  }, {})
}

function getStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(getString).filter((item): item is string => item.length > 0)
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className={s.emptyState}>
      <strong>Không có chủ đề nào</strong>
      <span>Thêm chủ đề mới hoặc đổi bộ lọc để xem lại hàng đợi.</span>
      <button className={s.primaryBtn} onClick={onAdd}>
        + Thêm chủ đề
      </button>
    </div>
  )
}

function TopicActions({
  topic,
  isGeneratingBrief,
  isResearching,
  isDeleting,
  onOpen,
  onGenerateBrief,
  onStartResearch,
  onRetryResearch,
  onDelete,
}: {
  topic: Topic
  isGeneratingBrief: boolean
  isResearching: boolean
  isDeleting: boolean
  onOpen: () => void
  onGenerateBrief: () => void
  onStartResearch: () => void
  onRetryResearch: () => void
  onDelete: () => void
}) {
  if (topic.status === "processing") {
    return (
      <div className={s.actions}>
        <button className={s.actionBtn} disabled>
          Đang nghiên cứu…
        </button>
        <button className={s.deleteBtn} disabled>
          Xóa
        </button>
      </div>
    )
  }

  if (topic.status === "pending") {
    return (
      <div className={s.actions}>
        <button className={s.actionBtn} onClick={onStartResearch} disabled={isResearching}>
          {isResearching ? "Đang nghiên cứu…" : "Nghiên cứu"}
        </button>
        <button className={s.secondaryActionBtn} onClick={onGenerateBrief} disabled={isGeneratingBrief}>
          {isGeneratingBrief ? "Đang tạo..." : "Brief nhanh"}
        </button>
        <button className={s.deleteBtn} onClick={onDelete} disabled={isDeleting}>
          {isDeleting ? "Đang xóa..." : "Xóa"}
        </button>
      </div>
    )
  }

  if (topic.status === "failed") {
    return (
      <div className={s.actions}>
        <button className={s.actionBtn} onClick={onRetryResearch} disabled={isResearching}>
          {isResearching ? "Đang thử lại…" : "Thử lại"}
        </button>
        <button className={s.secondaryActionBtn} onClick={onGenerateBrief} disabled={isGeneratingBrief}>
          {isGeneratingBrief ? "Đang tạo..." : "Brief nhanh"}
        </button>
        <button className={s.deleteBtn} onClick={onDelete} disabled={isDeleting}>
          {isDeleting ? "Đang xóa..." : "Xóa"}
        </button>
      </div>
    )
  }

  return (
    <div className={s.actions}>
      <button className={s.actionBtn} onClick={onOpen}>
        Xem research
      </button>
      <button className={s.deleteBtn} onClick={onDelete} disabled={isDeleting}>
        {isDeleting ? "Đang xóa..." : "Xóa"}
      </button>
    </div>
  )
}
