import { useState } from "react"
import { generateBrief } from "../../api/briefs"
import type { ApiClient } from "../../api/client"
import { retryTopic, startTopic } from "../../api/topics"
import { getErrorMessage } from "../../api/errors"
import type { Topic } from "../../types/domain"
import { useIsMobile } from "../../hooks/useIsMobile"
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
}

const FILTERS: { value: Topic["status"] | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ" },
  { value: "processing", label: "Đang chạy" },
  { value: "completed", label: "Xong" },
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

function StatusBadge({ status }: { status: Topic["status"] }) {
  return (
    <span className={`${s.statusBadge} ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function Progress({ topic }: { topic: Topic }) {
  if (topic.status === "processing" && topic.researchProgress !== undefined) {
    return (
      <div className={s.progressBlock}>
        <div className={s.progressTrack}>
          <div
            className={s.progressFill}
            style={{ width: `${topic.researchProgress}%` }}
          />
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
}: TopicsQueueProps) {
  const isMobile = useIsMobile()
  const [filter, setFilter] = useState<Topic["status"] | "all">("all")
  const [search, setSearch] = useState("")
  const [generatingBriefIds, setGeneratingBriefIds] = useState<Set<string>>(new Set())
  const [researchingTopicIds, setResearchingTopicIds] = useState<Set<string>>(new Set())
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const allTopics = topics

  const filtered = allTopics.filter((topic) => {
    const matchFilter = filter === "all" || topic.status === filter
    const matchSearch = topic.title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const openTopic = (topic: Topic) => {
    if (topic.status === "completed") onNavigate(`topic-${topic.id}`)
  }

  const handleStartResearch = async (topic: Topic) => {
    if (workspaceId.length === 0 || researchingTopicIds.has(topic.id)) {
      return
    }

    setActionError(null)
    setActionMessage(null)
    setResearchingTopicIds((current) => new Set([...current, topic.id]))
    try {
      const nextTopic = await startTopic(apiClient, workspaceId, topic.id)
      onTopicChange?.(nextTopic)
      setActionMessage(`Đã nghiên cứu xong “${topic.title}”.`)
    } catch (researchError: unknown) {
      setActionError(getErrorMessage(researchError))
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
    try {
      const nextTopic = await retryTopic(apiClient, workspaceId, topic.id)
      onTopicChange?.(nextTopic)
      setActionMessage(`Đã nghiên cứu lại “${topic.title}”.`)
    } catch (researchError: unknown) {
      setActionError(getErrorMessage(researchError))
    } finally {
      setResearchingTopicIds((current) => {
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
        Gợi ý chủ đề
      </button>
      <button className={s.primaryBtn} onClick={() => onNavigate("add-topics")}>
        + Thêm chủ đề
      </button>
    </div>
  )

  return (
    <PageShell
      title="Hàng đợi chủ đề"
      subtitle={`${allTopics.length} chủ đề · ${pendingCount(allTopics)} đang chờ`}
      actions={!isMobile ? headerActions : undefined}
    >
      {isLoading && allTopics.length === 0 ? <div className={s.emptyState}>Đang tải chủ đề...</div> : null}
      {error ? <div className={s.emptyState}>{error}</div> : null}
      {actionError ? <div className={s.emptyState}>{actionError}</div> : null}
      {actionMessage ? <div className={s.emptyState}>{actionMessage}</div> : null}

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
                    onClick={() => openTopic(topic)}
                  >
                    {topic.title}
                  </button>
                  {topic.opportunityScore !== undefined ? (
                    <span className={s.score}>{topic.opportunityScore}</span>
                  ) : null}
                </div>

                <div className={s.mobileMetaRow}>
                  <StatusBadge status={topic.status} />
                  {topic.status === "processing" && topic.currentStep ? (
                    <span className={s.currentStep}>{topic.currentStep}</span>
                  ) : null}
                </div>

                <Progress topic={topic} />
                <TopicActions
                  topic={topic}
                  isGeneratingBrief={generatingBriefIds.has(topic.id)}
                  isResearching={researchingTopicIds.has(topic.id)}
                  onOpen={() => onNavigate(`topic-${topic.id}`)}
                  onGenerateBrief={() => void handleGenerateBrief(topic)}
                  onStartResearch={() => void handleStartResearch(topic)}
                  onRetryResearch={() => void handleRetryResearch(topic)}
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
            {[
              "Chủ đề",
              "Trạng thái",
              "Tiến độ",
              "Cơ hội",
              "Ngày tạo",
              "Hành động",
            ].map((label) => (
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
                    onClick={() => openTopic(topic)}
                  >
                    {topic.title}
                  </button>
                  {topic.status === "processing" && topic.currentStep ? (
                    <span className={s.currentStep}>{topic.currentStep}</span>
                  ) : null}
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
                <time className={s.dateText}>
                  {new Date(topic.createdAt).toLocaleDateString("vi-VN")}
                </time>
                <TopicActions
                  topic={topic}
                  isGeneratingBrief={generatingBriefIds.has(topic.id)}
                  isResearching={researchingTopicIds.has(topic.id)}
                  onOpen={() => onNavigate(`topic-${topic.id}`)}
                  onGenerateBrief={() => void handleGenerateBrief(topic)}
                  onStartResearch={() => void handleStartResearch(topic)}
                  onRetryResearch={() => void handleRetryResearch(topic)}
                />
              </div>
            ))
          )}
        </div>
      )}
    </PageShell>
  )
}

function pendingCount(topics: Topic[]) {
  return topics.filter((topic) => topic.status === "pending").length
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
  onOpen,
  onGenerateBrief,
  onStartResearch,
  onRetryResearch,
}: {
  topic: Topic
  isGeneratingBrief: boolean
  isResearching: boolean
  onOpen: () => void
  onGenerateBrief: () => void
  onStartResearch: () => void
  onRetryResearch: () => void
}) {
  if (topic.status === "processing") {
    return (
      <div className={s.actions}>
        <button className={s.actionBtn} disabled>
          Đang nghiên cứu…
        </button>
      </div>
    )
  }

  if (topic.status === "pending") {
    return (
      <div className={s.actions}>
        <button className={s.actionBtn} onClick={onStartResearch} disabled={isResearching}>
          {isResearching ? "Đang nghiên cứu…" : "Bắt đầu nghiên cứu"}
        </button>
        <button className={s.actionBtn} onClick={onGenerateBrief} disabled={isGeneratingBrief}>
          {isGeneratingBrief ? "Đang tạo..." : "Tạo brief nhanh"}
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
        <button className={s.actionBtn} onClick={onGenerateBrief} disabled={isGeneratingBrief}>
          {isGeneratingBrief ? "Đang tạo..." : "Tạo brief nhanh"}
        </button>
      </div>
    )
  }

  return (
    <div className={s.actions}>
      <button className={s.actionBtn} onClick={onOpen}>
        Xem research
      </button>
      <button className={s.actionBtn} onClick={onGenerateBrief} disabled={isGeneratingBrief}>
        {isGeneratingBrief ? "Đang tạo..." : "Tạo brief"}
      </button>
    </div>
  )
}
