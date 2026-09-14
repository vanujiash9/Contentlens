import PageShell from "../ui/PageShell"
import { MOCK_TOPICS, MOCK_ACTIVITY } from "../../data/mockData"
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

const ACTIVITY_LABELS: Record<string, { label: string; className: string }> = {
  research_done: { label: "Hoàn thành nghiên cứu", className: s.green },
  topic_added: { label: "Tạo chủ đề mới", className: s.gray },
  brief_created: { label: "Cập nhật nội dung", className: s.gray },
  research_failed: { label: "Nghiên cứu thất bại", className: s.red },
  research_started: { label: "Đang chạy nghiên cứu", className: s.orange },
  ai_discovery: { label: "AI khám phá chủ đề", className: s.gray },
}

const CONTENT_SUFFIXES = [
  ": Đâu là lựa chọn phù hợp?",
  ": Hướng dẫn từ A đến Z",
  ": Có đáng mua không?",
  ": Hướng dẫn chi tiết",
]
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
  const safe = total || 1
  const p = (pending / safe) * 100
  const r = p + (processing / safe) * 100
  const c = r + (completed / safe) * 100
  const gradient = `conic-gradient(var(--status-neutral) 0 ${p}%, var(--status-warning) ${p}% ${r}%, var(--status-success) ${r}% ${c}%, var(--status-danger) ${c}% 100%)`
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
            <em>{Math.round((value / safe) * 100)}%</em>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Overview({
  onNavigate,
}: {
  onNavigate: (v: string) => void
}) {
  const isMobile = useIsMobile()
  const topics = MOCK_TOPICS
  const processing = topics.filter((t) => t.status === "processing")
  const completed = topics.filter((t) => t.status === "completed")
  const failed = topics.filter((t) => t.status === "failed")
  const pending = topics.filter((t) => t.status === "pending")
  const topOpportunity = [...topics]
    .filter((t) => t.opportunityScore != null)
    .sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))[0]
  const recentTopics = [...topics]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5)
  const contentItems = completed
    .slice(0, 5)
    .map((t, i) => ({
      id: t.id,
      title: t.title + CONTENT_SUFFIXES[i % CONTENT_SUFFIXES.length],
      updatedAt: t.updatedAt,
      type: ["comparison", "review", "article", "comparison", "product"][i % 5],
    }))
  const stats = [
    {
      label: "Tổng nghiên cứu",
      value: topics.length,
      tone: "blue",
      delta: "+3 tuần này",
    },
    {
      label: "Đang chạy",
      value: processing.length,
      tone: "orange",
      delta: "1 cần theo dõi",
    },
    {
      label: "Hoàn thành",
      value: completed.length,
      tone: "green",
      delta: "+1 brief mới",
    },
    {
      label: "Thất bại",
      value: failed.length,
      tone: "red",
      delta: "1 cần thử lại",
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
      subtitle="Theo dõi nghiên cứu, phát hiện topic tiềm năng và duyệt brief đã sẵn sàng."
      actions={headerActions}
    >
      <section className={s.focusPanel}>
        <div className={s.heroCard}>
          <div className={s.heroContent}>
            <p className={s.eyebrow}>Focus tuần này</p>
            <h2 className={s.heroTitle}>
              {pending.length} topic đang chờ quyết định
            </h2>
            <p className={s.heroText}>
              Ưu tiên các nghiên cứu có opportunity score cao, sau đó duyệt
              brief đã hoàn thành để chuyển nhanh sang sản xuất nội dung.
            </p>
            <div className={s.heroMetrics}>
              <div className={s.heroMetric}>
                <strong>{completed.length}</strong>
                <span>đã hoàn thành</span>
              </div>
              <div className={s.heroMetric}>
                <strong>{processing.length}</strong>
                <span>đang chạy</span>
              </div>
              <div className={s.heroMetric}>
                <strong>{failed.length}</strong>
                <span>cần xử lý</span>
              </div>
            </div>
          </div>
        </div>
        <aside className={s.priorityCard}>
          <p className={s.priorityLabel}>Cơ hội cao nhất</p>
          <h3 className={s.priorityTitle}>
            {topOpportunity?.title ?? "Chưa có topic"}
          </h3>
          <p className={s.priorityText}>
            {topOpportunity?.opportunityScore ?? 0}/100 · nên đưa vào research
            queue trước.
          </p>
          <button
            className={s.primaryBtn}
            onClick={() =>
              topOpportunity && onNavigate(`topic-${topOpportunity.id}`)
            }
          >
            Xem chi tiết
          </button>
        </aside>
      </section>

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
                  st.tone === "red" ? s.redText : s.greenText
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
                  <tr key={t.id} onClick={() => onNavigate(`topic-${t.id}`)}>
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
            {contentItems.map((c) => (
              <article className={s.contentItem} key={c.id}>
                <strong>{c.title}</strong>
                <div className={s.contentMeta}>
                  <span className={`${s.typeBadge} ${s[`type_${c.type}`]}`}>
                    {CONTENT_TYPE_LABELS[c.type]}
                  </span>
                  <span>{fmtDate(c.updatedAt)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.card} ${s.activityCard}`}>
        <div className={s.cardTitleRow}>
          <h2>Hoạt động gần đây</h2>
          <button>Xem tất cả →</button>
        </div>
        <div className={s.activityTimeline}>
          {MOCK_ACTIVITY.slice(0, 5).map((ev, i) => {
            const cfg = ACTIVITY_LABELS[ev.type] ?? {
              label: "Sự kiện",
              className: s.gray,
            }
            return (
              <div className={s.activityRow} key={ev.id}>
                <div className={s.activityDotCol}>
                  <i className={cfg.className} />
                  {i < 4 && <span />}
                </div>
                <div className={s.activityText}>
                  <strong>{cfg.label}</strong>
                  <small>{ev.topicTitle}</small>
                </div>
                <time>{ev.time}</time>
              </div>
            )
          })}
        </div>
      </section>
    </PageShell>
  )
}
