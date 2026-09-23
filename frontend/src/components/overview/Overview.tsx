import PageShell from "../ui/PageShell"
import type { BriefSummary } from "../../api/briefs"
import type { Topic } from "../../types/domain"
import { useIsMobile } from "../../hooks/useIsMobile"
import s from "./Overview.module.css"

function fmtDate(iso: string, withTime = false) {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  if (!withTime) return `${dd}/${mm}/${yyyy}`
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

const STATUS = {
  completed: { label: "Hoàn thành", className: s.green },
  processing: { label: "Đang chạy", className: s.orange },
  failed: { label: "Thất bại", className: s.red },
  pending: { label: "Chờ xử lý", className: s.gray },
} as const

function DotStatus({ status }: { status: string }) {
  const cfg = STATUS[(status as keyof typeof STATUS)] ?? {
    label: status,
    className: s.gray,
  }
  return (
    <span className={`${s.status} ${cfg.className}`}>
      <i />
      {cfg.label}
    </span>
  )
}

type ActivityType = "research_done" | "topic_added" | "brief_created" | "research_failed" | "research_started"

interface RecentActivity {
  id: string
  type: ActivityType
  topicTitle: string
  updatedAt: string
}

const ACTIVITY_LABELS: Record<ActivityType, { label: string; className: string }> = {
  research_done: { label: "Hoàn thành nghiên cứu", className: s.green },
  topic_added: { label: "Tạo chủ đề mới", className: s.gray },
  brief_created: { label: "Tạo Content Brief", className: s.gray },
  research_failed: { label: "Nghiên cứu thất bại", className: s.red },
  research_started: { label: "Đang chạy nghiên cứu", className: s.orange },
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  review: "Đánh giá",
  comparison: "So sánh",
  article: "Hướng dẫn",
  product: "Danh sách",
}

function StatIcon({ tone }: { tone: string }) {
  if (tone === "orange")
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 3v6l4 2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  if (tone === "green")
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M4 9.5l3 3L14 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  if (tone === "red")
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M5 5l8 8M13 5l-8 8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    )
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect
        x="3"
        y="3"
        width="5"
        height="5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="10"
        y="3"
        width="5"
        height="5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="3"
        y="10"
        width="5"
        height="5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="10"
        y="10"
        width="5"
        height="5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function QualityChart() {
  const values = [34, 51, 52, 64, 68, 72, 80]
  const labels = ["22/08", "23/08", "24/08", "25/08", "26/08", "27/08", "28/08"]
  const points = values.map((v, i) => `${(i * 100) / 6},${100 - v}`).join(" ")
  return (
    <div
      className={s.chartWrap}
      aria-label="Điểm chất lượng nghiên cứu tăng từ 34 lên 80 trong 7 ngày"
    >
      <div className={s.yLabels}>
        <span>100</span>
        <span>80</span>
        <span>60</span>
        <span>40</span>
        <span>20</span>
        <span>0</span>
      </div>
      <div className={s.chartArea}>
        <div className={s.gridLines}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <i key={i} />
          ))}
        </div>
        <svg
          viewBox="0 0 600 100"
          preserveAspectRatio="none"
          className={s.lineChart}
          role="img"
        >
          <polyline
            points={points}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
          {values.map((v, i) => (
            <circle
              key={i}
              cx={(i * 100) / 6}
              cy={100 - v}
              r="3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className={s.xLabels}>
          {labels.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function buildRecentActivity(topics: Topic[], briefs: BriefSummary[]): RecentActivity[] {
  return [
    ...topics.map(activityFromTopic),
    ...briefs.map(activityFromBrief),
  ]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5)
}

function activityFromTopic(topic: Topic): RecentActivity {
  const typeByStatus: Record<Topic["status"], ActivityType> = {
    pending: "topic_added",
    processing: "research_started",
    completed: "research_done",
    failed: "research_failed",
  }

  return {
    id: `topic-${topic.id}`,
    type: typeByStatus[topic.status],
    topicTitle: topic.title,
    updatedAt: topic.updatedAt,
  }
}

function activityFromBrief(brief: BriefSummary): RecentActivity {
  return {
    id: `brief-${brief.id}`,
    type: "brief_created",
    topicTitle: brief.title,
    updatedAt: brief.updatedAt,
  }
}

function formatActivityTime(iso: string): string {
  const date = new Date(iso)
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function StatusDonut({
  pending,
  processing,
  completed,
  failed,
  total,
}: {
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
}) {
  const hasData = total > 0
  const safe = hasData ? total : 1
  const p = (pending / safe) * 100
  const r = p + (processing / safe) * 100
  const c = r + (completed / safe) * 100
  const gradient = hasData
    ? `conic-gradient(var(--status-neutral) 0 ${p}%, var(--status-warning) ${p}% ${r}%, var(--status-success) ${r}% ${c}%, var(--status-danger) ${c}% 100%)`
    : "var(--surface-inset)"
  const rows = [
    ["Chờ xử lý", pending, s.gray],
    ["Đang chạy", processing, s.orange],
    ["Hoàn thành", completed, s.green],
    ["Thất bại", failed, s.red],
  ] as const
  return (
    <div className={s.donutBody}>
      <div className={s.donut} style={{ background: gradient }}>
        <div>
          <strong>{total}</strong>
          <span>nghiên cứu</span>
        </div>
      </div>
      <div className={s.legend}>
        {rows.map(([label, value, cls]) => (
          <div className={s.legendRow} key={label}>
            <span className={`${s.legendDot} ${cls}`} />
            <span>{label}</span>
            <strong>{value}</strong>
            <em>{hasData ? Math.round((value / safe) * 100) : 0}%</em>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Overview({
  onNavigate,
  topics,
  briefs,
}: {
  onNavigate: (v: string) => void
  topics: Topic[]
  briefs: BriefSummary[]
}) {
  const isMobile = useIsMobile()
  const processing = topics.filter((t) => t.status === "processing")
  const completed = topics.filter((t) => t.status === "completed")
  const failed = topics.filter((t) => t.status === "failed")
  const pending = topics.filter((t) => t.status === "pending")
  const recentTopics = [...topics]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5)
  const pendingBriefs = briefs.filter((brief) => brief.reviewStatus !== "approved")
  const contentItems = [...briefs]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5)
    .map((brief) => ({
      id: brief.id,
      title: brief.title,
      updatedAt: brief.updatedAt,
      type: "article",
    }))
  const recentActivity = buildRecentActivity(topics, briefs)
  const stats = [
    {
      label: "Tổng nghiên cứu",
      value: topics.length,
      tone: "blue",
      delta: `${pending.length} đang chờ`,
    },
    {
      label: "Đang chạy",
      value: processing.length,
      tone: "orange",
      delta: processing.length > 0 ? `${processing.length} cần theo dõi` : "Không có job đang chạy",
    },
    {
      label: "Hoàn thành",
      value: briefs.length,
      tone: "green",
      delta: "brief đã tạo",
    },
    {
      label: "Thất bại",
      value: failed.length,
      tone: "red",
      delta: failed.length > 0 ? `${failed.length} cần xử lý` : `${pendingBriefs.length} brief chờ duyệt`,
    },
  ]

  const headerActions = !isMobile ? (
    <div className={s.headerActions}>
      <button className={s.dateBtn}>22/08/2026 - 28/08/2026</button>
      <button className={s.primaryBtn} onClick={() => onNavigate("add-topics")}>
        Nghiên cứu mới
      </button>
    </div>
  ) : undefined

  return (
    <PageShell
      title="Tổng quan"
      subtitle="Theo dõi flow từ thêm topic, research, tạo brief đến duyệt nội dung."
      actions={headerActions}
    >
      <section className={s.statsGrid}>
        {stats.map((st) => (
          <div className={s.statCard} key={st.label}>
            <div
              className={`${s.statIcon} ${
                st.tone === "blue" ? "" : s[st.tone]
              }`}
            >
              <StatIcon tone={st.tone} />
            </div>
            <div>
              <div className={s.statLabel}>{st.label}</div>
              <strong className={s.statValue}>{st.value}</strong>
              <div
                className={`${s.statDelta} ${
                  st.tone === "red"
                    ? s.redText
                    : st.tone === "orange"
                      ? s.orangeText
                      : s.greenText
                }`}
              >
                {st.delta}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className={s.chartsGrid}>
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div>
              <h2>Chất lượng nghiên cứu theo thời gian</h2>
              <p>Điểm chất lượng trung bình của các nghiên cứu hoàn thành.</p>
            </div>
            <button className={s.softBtn}>7 ngày qua</button>
          </div>
          <QualityChart />
        </div>
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div>
              <h2>Phân bố trạng thái</h2>
              <p>Tình trạng của toàn bộ queue.</p>
            </div>
          </div>
          <StatusDonut
            pending={pending.length}
            processing={processing.length}
            completed={completed.length}
            failed={failed.length}
            total={topics.length}
          />
        </div>
      </section>

      <section className={s.tablesGrid}>
        <div className={s.card}>
          <div className={s.cardTitleRow}>
            <h2>Nghiên cứu gần đây</h2>
            <button onClick={() => onNavigate("topics")}>Xem tất cả →</button>
          </div>
          <div className={s.tableScroll}>
            <table className={s.researchTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Chủ đề</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {recentTopics.map((t, i) => (
                  <tr
                    key={t.id}
                    onClick={() => onNavigate(`topic-${t.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onNavigate(`topic-${t.id}`)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <td>{i + 1}</td>
                    <td className={s.topicCell}>{t.title}</td>
                    <td>
                      <DotStatus status={t.status} />
                    </td>
                    <td>{fmtDate(t.createdAt)}</td>
                    <td>{fmtDate(t.updatedAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={s.card}>
          <div className={s.cardTitleRow}>
            <h2>Nội dung mới nhất</h2>
            <button onClick={() => onNavigate("briefs")}>Xem tất cả →</button>
          </div>
          <div className={s.contentList}>
            {contentItems.length === 0 ? (
              <div className={s.contentItem}>
                <strong>Chưa có content brief nào.</strong>
                <div className={s.contentMeta}>Tạo brief từ hàng đợi chủ đề để hiển thị tại đây.</div>
              </div>
            ) : (
              contentItems.map((c) => (
                <article className={s.contentItem} key={c.id}>
                  <strong>{c.title}</strong>
                  <div className={s.contentMeta}>
                    <span className={`${s.typeBadge} ${s[`type_${c.type}`]}`}>
                      {CONTENT_TYPE_LABELS[c.type]}
                    </span>
                    <span>{fmtDate(c.updatedAt)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className={`${s.card} ${s.activityCard}`}>
        <div className={s.cardTitleRow}>
          <h2>Hoạt động gần đây</h2>
          <button>Xem tất cả →</button>
        </div>
        <div className={s.activityTimeline}>
          {recentActivity.length === 0 ? (
            <div className={s.activityEmpty}>Chưa có hoạt động nào.</div>
          ) : (
            recentActivity.map((event, index) => {
              const cfg = ACTIVITY_LABELS[event.type]
              return (
                <div className={s.activityRow} key={event.id}>
                  <div className={s.activityDotCol}>
                    <i className={cfg.className} />
                    {index < recentActivity.length - 1 && <span />}
                  </div>
                  <div className={s.activityText}>
                    <strong>{cfg.label}</strong>
                    <small>{event.topicTitle}</small>
                  </div>
                  <time>{formatActivityTime(event.updatedAt)}</time>
                </div>
              )
            })
          )}
        </div>
      </section>
    </PageShell>
  )
}
