import { useState } from "react"
import { type Topic } from "../../data/mockData"
import { useIsMobile } from "../../hooks/useIsMobile"
import PageShell from "../ui/PageShell"
import s from "./TopicsQueue.module.css"

interface TopicsQueueProps {
  onNavigate: (view: string) => void
  topics: Topic[]
  isLoading?: boolean
  error?: string | null
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
  onNavigate,
  topics,
  isLoading = false,
  error = null,
}: TopicsQueueProps) {
  const isMobile = useIsMobile()
  const [filter, setFilter] = useState<Topic["status"] | "all">("all")
  const [search, setSearch] = useState("")

  const allTopics = topics

  const filtered = allTopics.filter((topic) => {
    const matchFilter = filter === "all" || topic.status === filter
    const matchSearch = topic.title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

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
      {isLoading ? <div className={s.emptyState}>Đang tải chủ đề...</div> : null}
      {error ? <div className={s.emptyState}>{error}</div> : null}

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
}: {
  topic: Topic
  onOpen: () => void
}) {
  return (
    <div className={s.actions}>
      {topic.status === "completed" ? (
        <button className={s.actionBtn} onClick={onOpen}>
          Xem
        </button>
      ) : null}
      {topic.status !== "completed" ? <span className={s.emptyValue}>Đang chờ API xử lý</span> : null}
    </div>
  )
}
