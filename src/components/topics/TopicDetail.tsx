import { useState } from "react"
import type { ReactNode } from "react"
import { MOCK_TOPICS, type Topic } from "../../data/mockData"
import { useIsMobile } from "../../hooks/useIsMobile"
import { colors } from "../../styles/tokens"
import s from "./TopicDetail.module.css"

const RESEARCH_STEPS = [
  "Lập kế hoạch",
  "Tìm kiếm",
  "Thu thập & xử lý nguồn",
  "Tổng hợp phát hiện",
  "Tạo nội dung",
]

interface TopicDetailProps {
  topicId: string
  onNavigate: (view: string) => void
}

type TabId = "overview" | "research" | "content"

const TABS: { id: TabId label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "research", label: "Nghiên cứu" },
  { id: "content", label: "Nội dung" },
]

function StatusBadge({ status }: { status: Topic["status"] }) {
  const cfg = {
    pending: {
      label: "Chờ xử lý",
      bg: colors.surface.muted,
      color: colors.text.muted,
    },
    processing: {
      label: "Đang nghiên cứu",
      bg: colors.status.warningBg,
      color: colors.status.warning,
    },
    completed: {
      label: "Hoàn thành",
      bg: colors.status.successBg,
      color: colors.status.success,
    },
    failed: {
      label: "Thất bại",
      bg: colors.status.errorBg,
      color: colors.status.error,
    },
  }
  const c = cfg[status]
  return (
    <span
      className={s.statusBadge}
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className={s.sectionCard}>
      <h3 className={s.sectionTitle}>{title}</h3>
      {children}
    </section>
  )
}

function ImportanceBadge({
  importance,
}: {
  importance: "high" | "medium" | "low"
}) {
  return (
    <span
      className={`${s.importanceBadge} ${
        importance === "high"
          ? s.importanceHigh
          : importance === "medium"
            ? s.importanceMedium
            : s.importanceLow
      }`}
    >
      {importance === "high"
        ? "Ưu tiên cao"
        : importance === "medium"
          ? "Ưu tiên vừa"
          : "Ưu tiên thấp"}
    </span>
  )
}

function SourceLink({
  title,
  url,
  domain,
}: {
  title: string
  url: string
  domain: string
}) {
  return (
    <a className={s.sourceLink} href={url} target="_blank" rel="noreferrer">
      <span className={s.sourceTitle}>{title}</span>
      <span className={s.sourceDomain}>{domain}</span>
    </a>
  )
}

function OverviewTab({ topic }: { topic: Topic }) {
  const isMobile = useIsMobile()
  const completedSteps =
    topic.status === "completed"
      ? RESEARCH_STEPS.length
      : topic.status === "processing" && topic.researchProgress
        ? Math.floor((topic.researchProgress / 100) * RESEARCH_STEPS.length)
        : 0

  return (
    <div
      className={s.overviewGrid}
      style={{ gridTemplateColumns: isMobile ? "1fr" : "240px minmax(0, 1fr)" }}
    >
      <SectionCard title="Tiến độ nghiên cứu">
        <div className={s.timelineList}>
          {RESEARCH_STEPS.map((step, i) => {
            const done = i < completedSteps
            const active = i === completedSteps && topic.status === "processing"
            return (
              <div key={step} className={s.timelineItem}>
                <div
                  className={s.timelineDot}
                  style={{
                    background: done
                      ? colors.status.successBg
                      : active
                        ? colors.status.warningBg
                        : colors.surface.muted,
                    borderColor: done
                      ? colors.status.successBorder
                      : active
                        ? colors.status.warningBorder
                        : colors.borderSubtle,
                    color: done
                      ? colors.status.success
                      : active
                        ? colors.status.warning
                        : colors.text.faint,
                  }}
                >
                  {done ? "✓" : active ? "↻" : i + 1}
                </div>
                <span
                  className={s.timelineLabel}
                  style={{
                    color: done
                      ? colors.text.primary
                      : active
                        ? colors.status.warning
                        : colors.text.muted,
                  }}
                >
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <div className={s.overviewSide}>
        <div className={s.summaryCard}>
          <div>
            <div className={s.metaLabel}>Trạng thái</div>
            <div className={s.metaValue}>{formatStatusLabel(topic.status)}</div>
          </div>
          <div>
            <div className={s.metaLabel}>Tiến độ</div>
            <div className={s.metaValue}>
              {topic.researchProgress ??
                (topic.status === "completed" ? 100 : 0)}
              %
            </div>
          </div>
          <div>
            <div className={s.metaLabel}>Nguồn tham khảo</div>
            <div className={s.metaValue}>{topic.sources?.length ?? 0}</div>
          </div>
          <div>
            <div className={s.metaLabel}>Phát hiện</div>
            <div className={s.metaValue}>{topic.findings?.length ?? 0}</div>
          </div>
        </div>

        {topic.opportunityScore !== undefined && (
          <div className={s.opportunityCard}>
            <div className={s.opportunityLabel}>Điểm cơ hội</div>
            <div className={s.opportunityValue}>{topic.opportunityScore}</div>
            <div className={s.opportunityScale}>/100</div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResearchTab({ topic }: { topic: Topic }) {
  if (
    !topic.researchPlan &&
    !topic.queries?.length &&
    !topic.sources?.length &&
    !topic.findings?.length &&
    !topic.gaps?.length
  ) {
    return <div className={s.emptyState}>Dữ liệu chưa sẵn sàng.</div>
  }

  return (
    <div className={s.sectionStack}>
      {topic.researchPlan && (
        <SectionCard title="Kế hoạch nghiên cứu">
          <div className={s.sectionBodyStack}>
            <div>
              <div className={s.metaLabel}>Mục tiêu</div>
              <p className={s.bodyText}>{topic.researchPlan.objective}</p>
            </div>
            <div>
              <div className={s.metaLabel}>Cách tiếp cận</div>
              <p className={s.bodyText}>{topic.researchPlan.approach}</p>
            </div>
            {topic.researchPlan.questions?.length > 0 && (
              <div>
                <div className={s.metaLabel}>Câu hỏi nghiên cứu</div>
                <ol className={s.orderedList}>
                  {topic.researchPlan.questions.map((q, i) => (
                    <li key={i} className={s.listText}>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {topic.queries?.length ? (
        <SectionCard title="Search queries">
          <div className={s.queriesTable}>
            {topic.queries.map((q, i) => (
              <div
                key={q.id}
                className={s.queryRow}
                style={{
                  borderBottom:
                    i < (topic.queries?.length ?? 0) - 1
                      ? `1px solid ${colors.borderSubtle}`
                      : "none",
                }}
              >
                <span className={s.monoText}>{q.query}</span>
                <div className={s.queryMeta}>
                  <span className={s.metaMini}>{q.resultsCount} kết quả</span>
                  <span
                    className={
                      q.status === "completed"
                        ? s.statusPillSuccess
                        : s.statusPillMuted
                    }
                  >
                    {q.status === "completed" ? "Xong" : "Đang xử lý"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {topic.findings?.length ? (
        <SectionCard title="Phát hiện chính">
          <div className={s.findingsList}>
            {topic.findings.map((f) => (
              <div key={f.id} className={s.findingRow}>
                <div
                  className={s.findingDot}
                  style={{
                    background:
                      f.confidence === "high"
                        ? colors.status.success
                        : f.confidence === "medium"
                          ? colors.status.warning
                          : colors.border,
                  }}
                />
                <div>
                  <p className={s.bodyText}>{f.claim}</p>
                  <span className={s.metaMini}>
                    Độ tin cậy:{" "}
                    {f.confidence === "high"
                      ? "Cao"
                      : f.confidence === "medium"
                        ? "Trung bình"
                        : "Thấp"}{" "}
                    · {f.sources.length} nguồn
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {topic.gaps?.length ? (
        <SectionCard title="Information gaps">
          <div className={s.gapsList}>
            {topic.gaps.map((gap) => (
              <div key={gap.id} className={s.gapCard}>
                <div className={s.gapHeader}>
                  <ImportanceBadge importance={gap.importance} />
                  <h4 className={s.gapTitle}>{gap.title}</h4>
                </div>
                <p className={s.bodyText}>{gap.description}</p>
                <div className={s.gapEvidence}>
                  <span className={s.metaMini}>Bằng chứng</span>
                  <p className={s.gapEvidenceText}>{gap.evidence}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {topic.sources?.length ? (
        <SectionCard title="Nguồn tham khảo">
          <div className={s.sourcesList}>
            {topic.sources.map((src) => (
              <div key={src.id} className={s.sourceCard}>
                <div className={s.sourceHeader}>
                  <SourceLink
                    title={src.title}
                    url={src.url}
                    domain={src.domain}
                  />
                  <span className={s.sourceRelevance}>{src.relevance}%</span>
                </div>
                <p className={s.bodyText}>{src.extractedInfo}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}

function ContentTab({ topic }: { topic: Topic }) {
  if (!topic.brief)
    return <div className={s.emptyState}>Dữ liệu chưa sẵn sàng.</div>
  const brief = topic.brief
  return (
    <div className={s.sectionStack}>
      <SectionCard title="Content Brief">
        <div className={s.briefGrid}>
          <div>
            <div className={s.metaLabel}>Ý định tìm kiếm</div>
            <div className={s.metaValue}>{brief.searchIntent}</div>
          </div>
          <div>
            <div className={s.metaLabel}>Đối tượng</div>
            <div className={s.metaValue}>{brief.targetAudience}</div>
          </div>
          <div>
            <div className={s.metaLabel}>Mục tiêu</div>
            <div className={s.metaValue}>{brief.objective}</div>
          </div>
          <div>
            <div className={s.metaLabel}>Góc nội dung</div>
            <div className={s.metaValue}>{brief.angle}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Outline">
        <div className={s.outlineList}>
          {brief.outline.map((item, i) => (
            <div key={i} className={s.outlineRow}>
              <span className={s.stepIndex}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className={s.outlineTitle}>{item.section}</div>
                <div className={s.outlineDesc}>{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Bản nháp nội dung">
        <div className={s.draftText}>{brief.draft}</div>
      </SectionCard>
    </div>
  )
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatDuration(): string {
  return "4 giờ"
}

function formatStatusLabel(status: Topic["status"]): string {
  return status === "pending"
    ? "Chờ xử lý"
    : status === "processing"
      ? "Đang nghiên cứu"
      : status === "completed"
        ? "Hoàn thành"
        : "Thất bại"
}

export default function TopicDetail({ topicId, onNavigate }: TopicDetailProps) {
  const isMobile = useIsMobile()
  const topic = MOCK_TOPICS.find((t) => t.id === topicId)
  const [tab, setTab] = useState<TabId>("overview")

  if (!topic) return <div className={s.emptyState}>Topic không tồn tại.</div>

  return (
    <div
      className={s.wrapper}
      style={{ padding: isMobile ? "24px 16px 32px" : "32px 40px 48px" }}
    >
      <div className={s.breadcrumb}>
        <button
          onClick={() => onNavigate("topics")}
          className={s.breadcrumbLink}
        >
          Hàng đợi chủ đề
        </button>
        <span className={s.breadcrumbSep}>›</span>
        <span className={s.breadcrumbCurrent}>{topic.title}</span>
      </div>

      <div className={s.header}>
        <div className={s.headerMain}>
          <h1 className={s.title}>{topic.title}</h1>
          <div className={s.headerMeta}>
            <StatusBadge status={topic.status} />
            <span className={s.headerMetaText}>
              Tạo {formatDate(topic.createdAt)}
            </span>
            <span className={s.headerMetaText}>
              Hoàn thành{" "}
              {topic.completedAt
                ? formatDate(topic.completedAt)
                : formatDate(topic.updatedAt)}
            </span>
            <span className={s.headerMetaText}>{formatDuration()}</span>
          </div>
        </div>
        {topic.opportunityScore !== undefined && (
          <div className={s.headerScore}>
            <div className={s.opportunityLabel}>Điểm cơ hội</div>
            <div className={s.opportunityValue}>{topic.opportunityScore}</div>
            <div className={s.opportunityScale}>/100</div>
          </div>
        )}
      </div>

      {topic.researchProgress !== undefined && (
        <div className={s.progressStrip}>
          <div className={s.progressLabel}>Tiến độ nghiên cứu</div>
          <div className={s.progressTrack} aria-hidden="true">
            <div
              className={s.progressFill}
              style={{ width: `${topic.researchProgress}%` }}
            />
          </div>
          <div className={s.progressValue}>{topic.researchProgress}%</div>
        </div>
      )}

      <div className={s.tabBar} role="tablist" aria-label="Topic detail tabs">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={active ? s.tabActive : s.tab}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === "overview" && <OverviewTab topic={topic} />}
      {tab === "research" && <ResearchTab topic={topic} />}
      {tab === "content" && <ContentTab topic={topic} />}
    </div>
  )
}
