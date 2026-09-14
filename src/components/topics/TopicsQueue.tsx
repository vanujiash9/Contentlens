import { useRef, useState } from "react"
import { MOCK_TOPICS, RESEARCH_STEPS, type Topic } from "../../data/mockData"
import { useIsMobile } from "../../hooks/useIsMobile"
import PageShell from "../ui/PageShell"
import s from "./TopicsQueue.module.css"

interface TopicsQueueProps {
  onNavigate: (view: string) => void
  extraTopics?: Topic[]
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

export default function TopicsQueue({ onNavigate, extraTopics = [] }: TopicsQueueProps) {
  const isMobile = useIsMobile()
  const [filter, setFilter] = useState<Topic["status"] | "all">("all")
  const [search, setSearch] = useState("")
  const [topics, setTopics] = useState(() => {
    const extraIds = new Set(extraTopics.map((t) => t.id))
    return [...MOCK_TOPICS.filter((t) => !extraIds.has(t.id)), ...extraTopics]
  })
  const timers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  const allTopics = (() => {
    const inState = new Set(topics.map((t) => t.id))
    const newExtra = extraTopics.filter((t) => !inState.has(t.id))
    return newExtra.length ? [...topics, ...newExtra] : topics
  })()

  const filtered = allTopics.filter((topic) => {
    const matchFilter = filter === "all" || topic.status === filter
    const matchSearch = topic.title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const handleStart = (id: string) => {
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === id && topic.status === "pending"
          ? {
              ...topic,
              status: "processing" as const,
              researchProgress: 0,
              currentStep: RESEARCH_STEPS[0].label,
            }
          : topic,
      ),
    )

    let pct = 0
    const timer = setInterval(() => {
      pct += Math.random() * 7 + 3
      if (pct >= 100) {
        pct = 100
        clearInterval(timer)
        timers.current.delete(id)
        setTopics((prev) =>
          prev.map((topic) =>
            topic.id === id
              ? {
                  ...topic,
                  status: "completed" as const,
                  researchProgress: 100,
                  currentStep: undefined,
                }
              : topic,
          ),
        )
        return
      }

      const stepIdx = Math.min(
        Math.floor((pct / 100) * RESEARCH_STEPS.length),
        RESEARCH_STEPS.length - 1,
      )
      setTopics((prev) =>
        prev.map((topic) =>
          topic.id === id
            ? {
                ...topic,
                researchProgress: Math.round(pct),
                currentStep: RESEARCH_STEPS[stepIdx].label,
              }
            : topic,
        ),
      )
    }, 900)

    timers.current.set(id, timer)
  }

  const handleRetry = (id: string) => {
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === id && topic.status === "failed"
          ? { ...topic, status: "pending" as const }
          : topic,
      ),
    )
  }

  const handleDelete = (id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearInterval(timer)
      timers.current.delete(id)
    }
    setTopics((prev) => prev.filter((topic) => topic.id !== id))
  }

  const openTopic = (topic: Topic) => {
    if (topic.status === "completed") onNavigate(`topic-${topic.id}`)
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
              {item.label}
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
                  onOpen={() => onNavigate(`topic-${topic.id}`)}
                  onStart={() => handleStart(topic.id)}
                  onRetry={() => handleRetry(topic.id)}
                  onDelete={() => handleDelete(topic.id)}
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
                  onOpen={() => onNavigate(`topic-${topic.id}`)}
                  onStart={() => handleStart(topic.id)}
                  onRetry={() => handleRetry(topic.id)}
                  onDelete={() => handleDelete(topic.id)}
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
  onOpen,
  onStart,
  onRetry,
  onDelete,
}: {
  topic: Topic
  onOpen: () => void
  onStart: () => void
  onRetry: () => void
  onDelete: () => void
}) {
  return (
    <div className={s.actions}>
      {topic.status === "completed" ? (
        <button className={s.actionBtn} onClick={onOpen}>
          Xem
        </button>
      ) : null}
      {topic.status === "pending" ? (
        <button className={s.actionBtn} onClick={onStart}>
          Bắt đầu
        </button>
      ) : null}
      {topic.status === "failed" ? (
        <button className={s.actionBtn} onClick={onRetry}>
          Thử lại
        </button>
      ) : null}
      <button className={s.deleteBtn} onClick={onDelete} aria-label={`Xóa ${topic.title}`}>
        ×
      </button>
    </div>
  )
}
