import { useState } from "react"
import type { Topic } from "../../types/domain"
import { colors } from "../../styles/tokens"
import PageShell from "../ui/PageShell"
import s from "./TopicDetail.module.css"

interface TopicDetailProps {
  topicId: string
  topics: Topic[]
  onNavigate: (view: string) => void
}

type TabId = "overview" | "sources"

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "sources", label: "Nguồn nghiên cứu" },
]

function StatusBadge({ status }: { status: Topic["status"] }) {
  const cfg = {
    pending: { label: "Chờ xử lý", bg: colors.surface.muted, color: colors.text.muted },
    processing: { label: "Đang nghiên cứu", bg: colors.status.warningBg, color: colors.status.warning },
    completed: { label: "Hoàn thành", bg: colors.status.successBg, color: colors.status.success },
    failed: { label: "Thất bại", bg: colors.status.errorBg, color: colors.status.error },
  }
  const c = cfg[status]
  return <span className={s.statusBadge} style={{ background: c.bg, color: c.color }}>{c.label}</span>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })
}

function OverviewTab({ topic, onNavigate }: { topic: Topic; onNavigate: (view: string) => void }) {
  const findings = topic.findings?.slice(0, 4) ?? []

  return (
    <div className={s.stack}>
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Kết quả nghiên cứu</h2>
        {topic.researchPlan?.objective ? (
          <p className={s.summary}>{topic.researchPlan.objective}</p>
        ) : findings.length ? (
          <p className={s.summary}>{findings[0].claim}</p>
        ) : (
          <p className={s.muted}>Kết quả nghiên cứu chưa sẵn sàng.</p>
        )}
      </section>

      {findings.length ? (
        <section className={s.section}>
          <div className={s.sectionHeading}>
            <h2 className={s.sectionTitle}>Phát hiện chính</h2>
            <span className={s.sectionMeta}>{topic.findings?.length ?? 0} phát hiện</span>
          </div>
          <div className={s.findings}>
            {findings.map((finding) => (
              <div key={finding.id} className={s.finding}>
                <span className={s.findingDot} />
                <div>
                  <p className={s.findingText}>{finding.claim}</p>
                  <span className={s.findingMeta}>{finding.sources.length} nguồn tham khảo</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {topic.brief ? (
        <section className={`${s.section} ${s.briefSection}`}>
          <div className={s.briefContent}>
            <div>
              <h2 className={s.sectionTitle}>Nội dung đã sẵn sàng</h2>
              <p className={s.briefDescription}>Content Brief đã được tạo từ kết quả nghiên cứu này.</p>
            </div>
            <button className={s.primaryButton} onClick={() => onNavigate("briefs")}>
              Xem Content Brief →
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function SourcesTab({ topic }: { topic: Topic }) {
  const sources = topic.sources ?? []
  if (!sources.length) return <div className={s.emptyState}>Nguồn nghiên cứu chưa sẵn sàng.</div>

  return (
    <section className={s.section}>
      <div className={s.sectionHeading}>
        <div>
          <h2 className={s.sectionTitle}>Nguồn nghiên cứu</h2>
          <p className={s.sectionDescription}>Các nguồn được sử dụng để tạo ra những phát hiện cho chủ đề này.</p>
        </div>
        <span className={s.sectionMeta}>{sources.length} nguồn</span>
      </div>

      <div className={s.sources}>
        {sources.map((source) => (
          <article key={source.id} className={s.source}>
            <div className={s.sourceTop}>
              <a className={s.sourceTitle} href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
              <span className={s.relevance}>{source.relevance}% liên quan</span>
            </div>
            <div className={s.sourceDomain}>{source.domain}</div>
            {source.extractedInfo ? <p className={s.sourceText}>{source.extractedInfo}</p> : null}
          </article>
        ))}
      </div>
    </section>
  )
}

export default function TopicDetail({ topicId, topics, onNavigate }: TopicDetailProps) {
  const topic = topics.find((item) => item.id === topicId)
  const [tab, setTab] = useState<TabId>("overview")

  if (!topic) return <div className={s.emptyState}>Topic không tồn tại.</div>

  const completedDate = topic.completedAt ? formatDate(topic.completedAt) : formatDate(topic.updatedAt)

  return (
    <PageShell showHeader={false}>
      <div className={s.pageMeta}>
        <button className={s.backButton} onClick={() => onNavigate("topics")}>← Nghiên cứu</button>
        <span className={s.pageHint}>Chi tiết chủ đề · xem nhanh kết quả, nguồn và brief</span>
      </div>

      <div className={s.hero}>
        <div className={s.heroMain}>
          <h1 className={s.title}>{topic.title}</h1>
          <div className={s.meta}>
            <StatusBadge status={topic.status} />
            <span>Tạo {formatDate(topic.createdAt)}</span>
            {topic.status === "completed" ? <span>Hoàn thành {completedDate}</span> : null}
            {topic.status === "processing" && topic.researchProgress !== undefined
              ? <span>{topic.researchProgress}%</span>
              : null}
          </div>
        </div>

        {topic.opportunityScore !== undefined ? (
          <div className={s.score}>
            <span className={s.scoreLabel}>Cơ hội</span>
            <span className={s.scoreValue}>{topic.opportunityScore}<span>/100</span></span>
          </div>
        ) : null}
      </div>

      <div className={s.tabs} role="tablist" aria-label="Chi tiết nghiên cứu">
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? s.tabActive : s.tab}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <main className={s.content}>
        {tab === "overview"
          ? <OverviewTab topic={topic} onNavigate={onNavigate} />
          : <SourcesTab topic={topic} />}
      </main>
    </PageShell>
  )
}
