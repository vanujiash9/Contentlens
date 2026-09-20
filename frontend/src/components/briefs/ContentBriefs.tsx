import { useEffect, useState } from "react"
import {
  approveBrief,
  deleteBrief,
  listBriefs,
  requestBriefRevision,
  saveBriefDraft,
  type BriefSummary,
} from "../../api/briefs"
import type { ApiClient } from "../../api/client"
import { getErrorMessage } from "../../api/errors"
import type { ContentBrief, Topic } from "../../types/domain"
import PageShell from "../ui/PageShell"
import { useIsMobile } from "../../hooks/useIsMobile"
import { layout } from "../../styles/tokens"
import s from "./ContentBriefs.module.css"

interface ContentBriefsProps {
  apiClient: ApiClient
  workspaceId: string
  initialBriefs?: BriefSummary[]
  onNavigate: (view: string) => void
  onBriefsChange?: (briefs: BriefSummary[]) => void
}

type BriefTopic = Topic & { brief: BriefSummary }

type ReviewStatus = "pending_review" | "approved"

function ReviewBadge({ status }: { status: ReviewStatus }) {
  const cfg = {
    pending_review: { label: "Chờ duyệt", bg: "#fffbeb", color: "#d97706" },
    approved: { label: "Đã duyệt", bg: "#f0fdf4", color: "#16a34a" },
  }
  const c = cfg[status]
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 8px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  )
}

function BriefCard({
  topic,
  reviewStatus,
  approvedAt,
  isDeleting,
  onOpen,
  onDelete,
}: {
  topic: BriefTopic
  reviewStatus: ReviewStatus
  approvedAt?: string
  isDeleting: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const isMobile = useIsMobile()
  const brief = topic.brief!

  return (
    <div
      className={s.briefCard}
      onClick={onOpen}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div
        className={s.briefCardBody}
        style={{ padding: isMobile ? "14px" : "18px 20px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className={s.briefTitle}>{brief.title}</h3>
            <div className={s.briefSource}>Từ: {topic.title}</div>
          </div>
          <ReviewBadge status={reviewStatus} />
        </div>

        <div
          className={s.metaGrid}
          style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
        >
          {[
            { label: "Search Intent", value: brief.searchIntent },
            { label: "Đối tượng", value: brief.targetAudience },
            { label: "Content Angle", value: brief.angle },
          ].map((item) => (
            <div key={item.label}>
              <span className={s.metaLabel}>{item.label}: </span>
              <span className={s.metaValue}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className={s.outlinePreview}>
          <div className={s.outlineLabel}>
            Outline · {brief.outline.length} phần
          </div>
          <div className={s.outlineTags}>
            {brief.outline.slice(0, isMobile ? 3 : 4).map((item, i) => (
              <span key={i} className={s.outlineTag}>
                {item.section}
              </span>
            ))}
            {brief.outline.length > (isMobile ? 3 : 4) && (
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                +{brief.outline.length - (isMobile ? 3 : 4)} nữa
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={s.briefFooter}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {topic.opportunityScore !== undefined && (
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Cơ hội:{" "}
              <span
                style={{
                  fontWeight: 700,
                  color: "#2563eb",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {topic.opportunityScore}
              </span>
            </span>
          )}
          {reviewStatus === "approved" && approvedAt && (
            <span style={{ fontSize: 11, color: "#16a34a" }}>
              ✓ Duyệt{" "}
              {new Date(approvedAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            disabled={isDeleting}
            style={{
              padding: "5px 10px",
              background: "#fff",
              color: "#dc2626",
              border: "1px solid #fecaca",
              borderRadius: 6,
              fontSize: 12,
              cursor: isDeleting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </button>
          <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 500 }}>
            Xem chi tiết →
          </span>
        </div>
      </div>
    </div>
  )
}

function RenderMd({ text }: { text: string }) {
  const lines = text.split("\n")
  let key = 0
  const inline = (line: string) =>
    line.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((p, i) => {
      if (/^\*\*[^*]+\*\*$/.test(p))
        return (
          <strong key={i} style={{ fontWeight: 600, color: "#111827" }}>
            {p.slice(2, -2)}
          </strong>
        )
      if (/^\[\d+\]$/.test(p))
        return (
          <sup
            key={i}
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#2563eb",
              marginLeft: 1,
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {p}
          </sup>
        )
      return p
    })
  return (
    <div className={s.reader}>
      {lines.map((line) => {
        if (line.startsWith("# ")) return <h1 key={key++}>{line.slice(2)}</h1>
        if (line.startsWith("## ")) return <h2 key={key++}>{line.slice(3)}</h2>
        if (line.startsWith("---")) return <hr key={key++} />
        if (line.startsWith("> "))
          return <blockquote key={key++}>{inline(line.slice(2))}</blockquote>
        if (line.trim() === "") return <div key={key++} style={{ height: 6 }} />
        return <p key={key++}>{inline(line)}</p>
      })}
    </div>
  )
}

function BriefViewer({
  topic,
  apiClient,
  workspaceId,
  onClose,
  onBriefChange,
  onStatusChange,
  existingApprovedAt,
}: {
  topic: BriefTopic
  apiClient: ApiClient
  workspaceId: string
  onClose: () => void
  onBriefChange: (brief: BriefSummary) => void
  onStatusChange?: (id: string, status: ReviewStatus, at?: string) => void
  existingApprovedAt?: string
}) {
  const isMobile = useIsMobile()
  const brief = topic.brief!
  const [reviewState, setReviewState] =
    useState<"idle" | "approved" | "requesting">(() =>
      existingApprovedAt ? "approved" : "idle",
    )
  const [approvedAt, setApprovedAt] = useState<string | undefined>(
    existingApprovedAt,
  )
  const [isEditingDraft, setIsEditingDraft] = useState(false)
  const [draftText, setDraftText] = useState(brief.draft ?? "")
  const [savedDraft, setSavedDraft] = useState(brief.draft ?? "")
  const [revisionRequest, setRevisionRequest] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRequestingRevision, setIsRequestingRevision] = useState(false)

  const applyServerBrief = (nextBrief: BriefSummary) => {
    onBriefChange(nextBrief)
    setDraftText(nextBrief.draft ?? "")
    setSavedDraft(nextBrief.draft ?? "")
    const nextStatus = nextBrief.reviewStatus === "approved" ? "approved" : "idle"
    setReviewState(nextStatus)
    setApprovedAt(nextBrief.approvedAt)
    onStatusChange?.(
      nextBrief.id,
      nextBrief.reviewStatus === "approved" ? "approved" : "pending_review",
      nextBrief.approvedAt,
    )
  }

  const handleSaveDraft = async () => {
    setActionError(null)
    setIsSavingDraft(true)
    try {
      const nextBrief = await saveBriefDraft(
        apiClient,
        workspaceId,
        brief.id,
        draftText,
        brief.version,
      )
      applyServerBrief(nextBrief)
      setIsEditingDraft(false)
    } catch (saveError: unknown) {
      setActionError(getErrorMessage(saveError))
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleApprove = async () => {
    setActionError(null)
    setIsApproving(true)
    try {
      const nextBrief = await approveBrief(apiClient, workspaceId, brief.id)
      applyServerBrief(nextBrief)
    } catch (approveError: unknown) {
      setActionError(getErrorMessage(approveError))
    } finally {
      setIsApproving(false)
    }
  }

  const handleRequestRevision = async () => {
    setActionError(null)
    setIsRequestingRevision(true)
    try {
      const nextBrief = await requestBriefRevision(
        apiClient,
        workspaceId,
        brief.id,
        revisionRequest,
        brief.version,
      )
      setRevisionRequest("")
      applyServerBrief(nextBrief)
    } catch (revisionError: unknown) {
      setActionError(getErrorMessage(revisionError))
    } finally {
      setIsRequestingRevision(false)
    }
  }

  return (
    <div
      className={s.viewerWrapper}
      style={{
        padding: isMobile ? "16px" : "24px 32px",
        maxWidth: layout.viewerWidth,
      }}
    >
      <button onClick={onClose} className={s.viewerBackBtn}>
        ← Quay lại Content Brief
      </button>
      <h1 className={s.viewerTitle} style={{ fontSize: isMobile ? 18 : 20 }}>
        {brief.title}
      </h1>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "18px 22px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
            gap: 20,
          }}
        >
          {[
            { label: "Search Intent", value: brief.searchIntent },
            { label: "Đối tượng", value: brief.targetAudience },
            { label: "Mục tiêu", value: brief.objective },
            { label: "Content Angle", value: brief.angle },
          ].map((item) => (
            <div key={item.label}>
              <div
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "minmax(0, 1.5fr) minmax(300px, 0.9fr)",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div className={s.sectionCard}>
          <h3 className={s.sectionTitle}>Outline bài viết</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {brief.outline.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#2563eb",
                    fontFamily: "JetBrains Mono, monospace",
                    minWidth: 18,
                    paddingTop: 2,
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div
                    style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}
                  >
                    {item.section}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className={s.sectionCard}>
            <h3 className={s.sectionTitle}>Câu hỏi chính</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {brief.keyQuestions.map((q, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 7, alignItems: "flex-start" }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#9ca3af",
                      fontFamily: "JetBrains Mono, monospace",
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    Q{i + 1}
                  </span>
                  <span
                    style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}
                  >
                    {q}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className={s.sectionCard}>
            <h3 className={s.sectionTitle}>Dữ kiện chính</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {brief.keyFacts.map((f, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 7, alignItems: "flex-start" }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 99,
                      background: "#2563eb",
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  <span
                    style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}
                  >
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: `1px solid ${isEditingDraft ? "#2563eb" : "#e5e7eb"}`,
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 14,
          transition: "border-color 0.15s",
        }}
      >
        <div
          style={{
            padding: "12px 18px",
            borderBottom: `1px solid ${isEditingDraft ? "#dbeafe" : "#f3f4f6"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: isEditingDraft ? "#eff6ff" : "#fafafa",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: isEditingDraft ? "#2563eb" : "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {isEditingDraft ? "Đang chỉnh sửa" : "Content Draft"}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {isEditingDraft ? (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  style={{
                    padding: "4px 12px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {isSavingDraft ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  onClick={() => {
                    setDraftText(savedDraft)
                    setIsEditingDraft(false)
                  }}
                  style={{
                    padding: "4px 10px",
                    background: "transparent",
                    color: "#6b7280",
                    border: "1px solid #e5e7eb",
                    borderRadius: 5,
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Huỷ
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditingDraft(true)}
                style={{
                  padding: "4px 10px",
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: 5,
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sửa tay
              </button>
            )}
          </div>
        </div>

        {isEditingDraft ? (
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            style={{
              width: "100%",
              minHeight: 420,
              padding: "22px 26px",
              border: "none",
              outline: "none",
              resize: "vertical",
              fontSize: 13,
              color: "#374151",
              fontFamily: "inherit",
              lineHeight: 1.75,
              background: "#fff",
              boxSizing: "border-box",
            }}
          />
        ) : (
          <div
            style={{ padding: "22px 26px", maxHeight: 480, overflowY: "auto" }}
          >
            {draftText.trim().length > 0 ? (
              <RenderMd text={draftText} />
            ) : (
              <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>
                Chưa có bản nháp đầy đủ. Hãy tạo lại brief hoặc dùng “Sửa tay” để bổ sung bài viết hoàn chỉnh.
              </div>
            )}
          </div>
        )}
      </div>

      {actionError && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 6,
            color: "#b91c1c",
            fontSize: 12,
            marginBottom: 10,
          }}
        >
          {actionError}
        </div>
      )}

      {reviewState === "idle" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleApprove}
            disabled={isApproving}
            style={{
              padding: "9px 20px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {isApproving ? "Đang duyệt..." : "✓ Duyệt"}
          </button>
          <button
            onClick={() => setReviewState("requesting")}
            disabled={isSavingDraft || isApproving}
            style={{
              padding: "9px 16px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Yêu cầu AI sửa
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            style={{
              padding: "9px 16px",
              background: "#fff",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {isSavingDraft ? "Đang lưu..." : "Lưu nháp"}
          </button>
        </div>
      )}
      {reviewState === "requesting" && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#111827",
              marginBottom: 4,
            }}
          >
            Yêu cầu chỉnh sửa
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
            Mô tả bạn muốn AI sửa gì — có thể chỉ định section cụ thể.
          </div>
          <textarea
            value={revisionRequest}
            onChange={(e) => setRevisionRequest(e.target.value)}
            rows={3}
            placeholder="Ví dụ: Viết lại phần kết luận theo hướng tư vấn mua đàn thực tế hơn."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              color: "#374151",
              fontFamily: "inherit",
              lineHeight: 1.6,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              background: "#fafafa",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={handleRequestRevision}
              disabled={isRequestingRevision || revisionRequest.trim().length === 0}
              style={{
                padding: "8px 14px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {isRequestingRevision ? "Đang sửa..." : "Gửi yêu cầu"}
            </button>
            <button
              onClick={() => {
                setRevisionRequest("")
                setReviewState("idle")
              }}
              style={{
                padding: "8px 14px",
                background: "#fff",
                color: "#6b7280",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
      {reviewState === "approved" && (
        <div
          style={{
            padding: "10px 16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 500 }}>
            ✓ Đã duyệt — Content sẵn sàng sử dụng
          </span>
          {approvedAt && (
            <span
              style={{
                fontSize: 11,
                color: "#9ca3af",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {new Date(approvedAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function ContentBriefs({
  apiClient,
  workspaceId,
  initialBriefs = [],
  onNavigate,
  onBriefsChange,
}: ContentBriefsProps) {
  const isMobile = useIsMobile()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] =
    useState<"all" | "pending_review" | "approved">("all")
  const [briefs, setBriefs] = useState<BriefSummary[]>(initialBriefs)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingBriefIds, setDeletingBriefIds] = useState<Set<string>>(new Set())
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, ReviewStatus>>({})
  const [approvalTimes, setApprovalTimes] = useState<Record<string, string>>({})

  useEffect(() => {
    setBriefs((current) => (current.length === 0 && initialBriefs.length > 0 ? initialBriefs : current))
  }, [initialBriefs])

  useEffect(() => {
    let isActive = true
    setIsLoading(true)
    setError(null)

    listBriefs(apiClient, workspaceId)
      .then((nextBriefs) => {
        if (!isActive) {
          return
        }
        setBriefs(nextBriefs)
        onBriefsChange?.(nextBriefs)
        setReviewStatuses((current) => {
          const next = { ...current }
          nextBriefs.forEach((brief) => {
            next[brief.id] = brief.reviewStatus === "approved" ? "approved" : "pending_review"
          })
          return next
        })
        setApprovalTimes((current) => {
          const next = { ...current }
          nextBriefs.forEach((brief) => {
            if (brief.approvedAt) {
              next[brief.id] = brief.approvedAt
            }
          })
          return next
        })
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(getErrorMessage(loadError))
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [apiClient, onBriefsChange, workspaceId])

  const topicsWithBriefs: BriefTopic[] = briefs.map((brief) => ({
    id: brief.id,
    title: brief.title,
    status: "completed",
    source: "ai",
    createdAt: brief.createdAt,
    updatedAt: brief.updatedAt,
    brief,
  }))

  const filtered =
    activeTab === "all"
      ? topicsWithBriefs
      : topicsWithBriefs.filter(
          (t) => (reviewStatuses[t.id] ?? "pending_review") === activeTab,
        )

  const handleDeleteBrief = async (brief: BriefSummary) => {
    const confirmed = window.confirm(`Xóa brief “${brief.title}”?`)
    if (!confirmed) {
      return
    }

    setError(null)
    setDeletingBriefIds((current) => new Set([...current, brief.id]))
    try {
      await deleteBrief(apiClient, workspaceId, brief.id)
      setBriefs((current) => {
        const next = current.filter((item) => item.id !== brief.id)
        onBriefsChange?.(next)
        return next
      })
      setReviewStatuses((current) => {
        const { [brief.id]: _removed, ...next } = current
        return next
      })
      setApprovalTimes((current) => {
        const { [brief.id]: _removed, ...next } = current
        return next
      })
      if (selectedId === brief.id) {
        setSelectedId(null)
      }
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError))
    } finally {
      setDeletingBriefIds((current) => {
        const next = new Set(current)
        next.delete(brief.id)
        return next
      })
    }
  }

  if (selectedId) {
    const topic = topicsWithBriefs.find((t) => t.id === selectedId)
    if (topic)
      return (
        <BriefViewer
          topic={topic}
          apiClient={apiClient}
          workspaceId={workspaceId}
          onClose={() => setSelectedId(null)}
          existingApprovedAt={approvalTimes[topic.id] ?? topic.brief.approvedAt}
          onBriefChange={(nextBrief) => {
            setBriefs((current) => {
              const next = current.map((brief) => (brief.id === nextBrief.id ? nextBrief : brief))
              onBriefsChange?.(next)
              return next
            })
          }}
          onStatusChange={(id, status, at) => {
            setReviewStatuses((p) => ({ ...p, [id]: status }))
            setApprovalTimes((current) => {
              if (at) {
                return { ...current, [id]: at }
              }
              const { [id]: _removed, ...next } = current
              return next
            })
          }}
        />
      )
  }

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "pending_review", label: "Chờ duyệt" },
    { key: "approved", label: "Đã duyệt" },
  ]

  return (
    <PageShell
      title="Lịch sử Content Brief"
      subtitle={`${topicsWithBriefs.length} brief đã tạo · Output cuối cùng của AI research`}
      maxWidth={layout.contentWidth}
    >
      {isLoading && briefs.length === 0 ? <div className={s.emptyCard}>Đang tải brief...</div> : null}
      {isLoading && briefs.length > 0 ? <div className={s.emptyText}>Đang cập nhật brief...</div> : null}
      {error ? <div className={s.emptyCard}>{error}</div> : null}
      <div className={s.tabBar}>
        {tabs.map((tab) => {
          const count =
            tab.key === "all"
              ? topicsWithBriefs.length
              : topicsWithBriefs.filter(
                  (t) => (reviewStatuses[t.id] ?? "pending_review") === tab.key,
                ).length
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 14px",
                background: "none",
                border: "none",
                borderBottom: active
                  ? "2px solid #2563eb"
                  : "2px solid transparent",
                color: active ? "#2563eb" : "#6b7280",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                marginBottom: -1,
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    background: active ? "#dbeafe" : "#f3f4f6",
                    color: active ? "#2563eb" : "#9ca3af",
                    padding: "1px 5px",
                    borderRadius: 3,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className={s.emptyCard}>
          <div className={s.emptyText}>Không có brief nào trong mục này.</div>
          <button
            onClick={() => onNavigate("topics")}
            style={{
              padding: "8px 18px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Bắt đầu nghiên cứu chủ đề
          </button>
        </div>
      ) : (
        <div className={s.briefList}>
          {filtered.map((topic) => (
            <BriefCard
              key={topic.id}
              topic={topic}
              reviewStatus={reviewStatuses[topic.id] ?? "pending_review"}
              approvedAt={approvalTimes[topic.id]}
              isDeleting={deletingBriefIds.has(topic.brief.id)}
              onOpen={() => setSelectedId(topic.id)}
              onDelete={() => void handleDeleteBrief(topic.brief)}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}
