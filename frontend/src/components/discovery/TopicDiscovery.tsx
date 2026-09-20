import { useEffect, useRef, useState } from "react"
import {
  addDiscoveredTopicToQueue,
  createDiscoveryRun,
  deleteDiscoveredTopic,
  getDiscoveryRun,
  getLatestDiscoveryRun,
  listDiscoveryRuns,
  type DiscoveryRun,
} from "../../api/discovery"
import type { ApiClient } from "../../api/client"
import { getErrorMessage } from "../../api/errors"
import type { DiscoveredTopic, SignalDetail, Topic } from "../../types/domain"
import { useIsMobile } from "../../hooks/useIsMobile"
import { layout } from "../../styles/tokens"
import PageShell from "../ui/PageShell"
import s from "./TopicDiscovery.module.css"

interface TopicDiscoveryProps {
  apiClient: ApiClient
  workspaceId: string
  onNavigate: (view: string) => void
  onAddToQueue?: (topic: Topic) => void
  initialRun?: DiscoveryRun | null
  onRunChange?: (run: DiscoveryRun | null) => void
}

const SIGNAL_COLOR: Record<string, string> = { high: "#16a34a", medium: "#d97706", low: "#9ca3af" }
const SIGNAL_BORDER: Record<string, string> = { high: "#bbf7d0", medium: "#fde68a", low: "#e5e7eb" }
const SIGNAL_BG: Record<string, string> = { high: "#f0fdf4", medium: "#fffbeb", low: "#f9fafb" }
const PRIORITY_LABELS = {
  high: "Ưu tiên cao",
  medium: "Ưu tiên trung bình",
  low: "Ưu tiên thấp",
} as const

type PeriodDays = 7 | 30 | 90

function getStorageKey(workspaceId: string): string {
  return `contentlens:last-discovery-run:${workspaceId}`
}

function getAddedTopicIds(topics: DiscoveredTopic[]): Set<string> {
  return new Set(
    topics
      .filter((topic) => topic.addedToQueueAt !== undefined || topic.topicId !== undefined)
      .map((topic) => topic.id),
  )
}

function mergeDiscoveryTopics(runs: DiscoveryRun[]): DiscoveredTopic[] {
  const seen = new Set<string>()
  return runs.flatMap((run) => run.topics).filter((topic) => {
    if (seen.has(topic.id)) {
      return false
    }
    seen.add(topic.id)
    return true
  })
}

function SignalCard({ label, signal }: { label: string; signal: SignalDetail }) {
  const color = SIGNAL_COLOR[signal.level]
  const bg = SIGNAL_BG[signal.level]
  const border = SIGNAL_BORDER[signal.level]

  return (
    <div
      style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", minWidth: 140, flex: "1 1 140px" }}
      aria-label={`${label}: ${signal.score}/100`}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 3 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1, fontFamily: "JetBrains Mono, monospace" }}>{signal.score}</span>
        <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "JetBrains Mono, monospace" }}>/100</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color, marginBottom: 3 }}>{signal.source}</div>
      <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.4 }}>{signal.evidence}</div>
    </div>
  )
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = size / 2 - 4
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? "#2563eb" : score >= 65 ? "#d97706" : "#9ca3af"

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }} aria-label={`Điểm cơ hội ${score} trên 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fontWeight: 700, fill: color, fontFamily: "JetBrains Mono, monospace" }}>
        {score}
      </text>
    </svg>
  )
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDone, 3000)
    return () => window.clearTimeout(timeoutId)
  }, [onDone])

  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1000, background: "#111827", color: "#fff", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 28px rgba(0,0,0,0.3)", animation: "slideUp 0.22s ease", maxWidth: 340, pointerEvents: "none" }}>
      <div style={{ width: 20, height: 20, borderRadius: 999, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>Đã thêm vào hàng đợi</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</div>
      </div>
    </div>
  )
}

export default function TopicDiscovery({
  apiClient,
  workspaceId,
  onNavigate,
  onAddToQueue,
  initialRun = null,
  onRunChange,
}: TopicDiscoveryProps) {
  const isMobile = useIsMobile()
  const [industry, setIndustry] = useState(initialRun?.industry ?? "Piano & nhạc cụ phím")
  const [market, setMarket] = useState(initialRun?.market ?? "Việt Nam")
  const [period, setPeriod] = useState<`${PeriodDays}`>(`${initialRun?.periodDays ?? 30}` as `${PeriodDays}`)
  const [count, setCount] = useState(String(initialRun?.resultCount ?? 10))
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(initialRun !== null)
  const [results, setResults] = useState<DiscoveredTopic[]>(initialRun?.topics ?? [])
  const [addedIds, setAddedIds] = useState<Set<string>>(() => getAddedTopicIds(initialRun?.topics ?? []))
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastKey = useRef(0)
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [autoFrequency, setAutoFrequency] = useState("weekly")
  const [autoCount, setAutoCount] = useState("10")
  const [autoAddToQueue, setAutoAddToQueue] = useState(false)

  useEffect(() => {
    if (initialRun === null) {
      return
    }

    setIndustry(initialRun.industry ?? "Piano & nhạc cụ phím")
    setMarket(initialRun.market ?? "Việt Nam")
    setPeriod(`${initialRun.periodDays ?? 30}` as `${PeriodDays}`)
    setCount(String(initialRun.resultCount))
    setResults(initialRun.topics)
    setAddedIds(getAddedTopicIds(initialRun.topics))
    setHasRun(true)
  }, [initialRun])

  useEffect(() => {
    if (initialRun !== null) {
      return
    }

    let isActive = true
    setIsRunning(true)
    setError(null)

    const applyRuns = (runs: DiscoveryRun[]) => {
      if (!isActive || runs.length === 0) {
        return
      }

      const latestRun = runs[0]
      const topics = mergeDiscoveryTopics(runs)
      setIndustry(latestRun.industry ?? "Piano & nhạc cụ phím")
      setMarket(latestRun.market ?? "Việt Nam")
      setPeriod(`${latestRun.periodDays ?? 30}` as `${PeriodDays}`)
      setCount(String(latestRun.resultCount))
      setResults(topics)
      setAddedIds(getAddedTopicIds(topics))
      setHasRun(true)
      onRunChange?.({ ...latestRun, topics })
      window.localStorage.setItem(getStorageKey(workspaceId), latestRun.id)
    }

    const runId = window.localStorage.getItem(getStorageKey(workspaceId))
    listDiscoveryRuns(apiClient, workspaceId, 50)
      .catch(() => {
        if (runId === null) {
          return []
        }

        return getDiscoveryRun(apiClient, workspaceId, runId).then((run) => [run])
      })
      .then((runs) => {
        applyRuns(runs)
      })
      .catch((restoreError: unknown) => {
        if (isActive) {
          setError(getErrorMessage(restoreError))
        }
      })
      .finally(() => {
        if (isActive) {
          setIsRunning(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [apiClient, initialRun, onRunChange, workspaceId])

  const handleDiscover = async () => {
    setIsRunning(true)
    setError(null)

    try {
      const run = await createDiscoveryRun(apiClient, workspaceId, {
        industry,
        market,
        periodDays: Number(period) as PeriodDays,
        resultCount: Number(count),
      })
      setResults((currentResults) => {
        const nextResults = mergeDiscoveryTopics([{ ...run, topics: run.topics }, { ...run, topics: currentResults }])
        setAddedIds(getAddedTopicIds(nextResults))
        onRunChange?.({ ...run, topics: nextResults })
        return nextResults
      })
      setHasRun(true)
      window.localStorage.setItem(getStorageKey(workspaceId), run.id)
      if (run.status === "failed") {
        setError(run.errorMessage ?? "AI chưa tạo được chủ đề. Vui lòng thử lại.")
      }
    } catch (runError: unknown) {
      setError(getErrorMessage(runError))
      setHasRun(true)
    } finally {
      setIsRunning(false)
    }
  }

  const handleAddToQueue = async (id: string) => {
    if (addingIds.has(id) || addedIds.has(id)) return

    setAddingIds((current) => new Set([...current, id]))
    setError(null)
    try {
      const topic = await addDiscoveredTopicToQueue(apiClient, workspaceId, id)
      setAddedIds((current) => new Set([...current, id]))
      setResults((currentResults) =>
        currentResults.map((currentTopic) =>
          currentTopic.id === id ? { ...currentTopic, topicId: topic.id } : currentTopic,
        ),
      )
      if (initialRun !== null) {
        onRunChange?.({
          ...initialRun,
          topics: initialRun.topics.map((currentTopic) =>
            currentTopic.id === id ? { ...currentTopic, topicId: topic.id } : currentTopic,
          ),
        })
      }
      onAddToQueue?.(topic)
      toastKey.current += 1
      setToastMsg(topic.title)
    } catch (addError: unknown) {
      setError(getErrorMessage(addError))
    } finally {
      setAddingIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  const handleDeleteSuggestion = async (topic: DiscoveredTopic) => {
    if (deletingIds.has(topic.id)) {
      return
    }

    const confirmed = window.confirm(`Xóa gợi ý “${topic.title}”?`)
    if (!confirmed) {
      return
    }

    setDeletingIds((current) => new Set([...current, topic.id]))
    setError(null)
    try {
      await deleteDiscoveredTopic(apiClient, workspaceId, topic.id)
      setResults((currentResults) => currentResults.filter((currentTopic) => currentTopic.id !== topic.id))
      setAddedIds((current) => {
        const next = new Set(current)
        next.delete(topic.id)
        return next
      })
      setAddingIds((current) => {
        const next = new Set(current)
        next.delete(topic.id)
        return next
      })
      if (initialRun !== null) {
        onRunChange?.({
          ...initialRun,
          topics: initialRun.topics.filter((currentTopic) => currentTopic.id !== topic.id),
        })
      }
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError))
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current)
        next.delete(topic.id)
        return next
      })
    }
  }

  return (
    <PageShell title="Khám phá topic mới" subtitle="Tìm topic mới, chọn chủ đề phù hợp rồi thêm vào Hàng đợi nghiên cứu." maxWidth={layout.contentWidth}>
      <div style={{ width: "100%" }}>
        <div className={s.configPanel}>
          <h2 className={s.configTitle}>Cấu hình khám phá</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 120px 120px", gap: 12, marginBottom: 16 }}>
            <div>
              <label className={s.fieldLabel}>Lĩnh vực</label>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={s.input} placeholder="Vd: Piano & nhạc cụ phím" />
            </div>
            <div>
              <label className={s.fieldLabel}>Thị trường</label>
              <input value={market} onChange={(e) => setMarket(e.target.value)} className={s.input} placeholder="Vd: Việt Nam" />
            </div>
            <div>
              <label className={s.fieldLabel}>Khoảng thời gian</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value as `${PeriodDays}`)} className={s.select}>
                <option value="7">7 ngày</option>
                <option value="30">30 ngày</option>
                <option value="90">90 ngày</option>
              </select>
            </div>
            <div>
              <label className={s.fieldLabel}>Số lượng</label>
              <select value={count} onChange={(e) => setCount(e.target.value)} className={s.select}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>
          </div>

          <button onClick={handleDiscover} disabled={isRunning} style={{ padding: "9px 20px", background: isRunning ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: isRunning ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
            {isRunning ? <><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: 999, animation: "spin 0.7s linear infinite" }} />Đang gợi ý...</> : <>Gợi ý chủ đề</>}
          </button>

          {isRunning ? <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>AI đang tạo danh sách chủ đề. Thường mất vài giây.</div> : null}
          {error ? <div className={s.emptyState} style={{ marginTop: 12 }}>{error}</div> : null}
        </div>

        {hasRun && results.length === 0 && !isRunning ? <div className={s.emptyState}>Chưa có chủ đề phù hợp. Hãy thử thay đổi cấu hình.</div> : null}

        {hasRun && results.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className={s.resultsHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Lịch sử gợi ý chủ đề</h2>
                <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "2px 7px", borderRadius: 4 }}>{results.length} chủ đề</span>
                {addedIds.size > 0 ? <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: 4 }}>✓ {addedIds.size} đã thêm vào hàng đợi</span> : null}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{market} · {period} ngày qua</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>Điểm là dự đoán AI, chưa phải dữ liệu search-volume thực tế. Thêm vào hàng đợi để chuyển sang nghiên cứu.</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results.map((topic, i) => {
                const added = addedIds.has(topic.id)
                const isAdding = addingIds.has(topic.id)
                const scoreColor = topic.opportunityScore >= 80 ? "#2563eb" : topic.opportunityScore >= 65 ? "#d97706" : "#9ca3af"
                return (
                  <div key={topic.id} className={s.resultCard} style={{ padding: isMobile ? "14px" : "16px 20px", opacity: added ? 0.75 : 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr auto", gap: isMobile ? 10 : 16, alignItems: "start" }}>
                      {!isMobile ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, paddingTop: 2 }}><ScoreRing score={topic.opportunityScore} size={52} /><span style={{ fontSize: 9, color: "#9ca3af", textAlign: "center" }}>Dự đoán</span></div> : null}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", fontFamily: "JetBrains Mono, monospace" }}>#{String(i + 1).padStart(2, "0")}</span>
                          {isMobile ? <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor, fontFamily: "JetBrains Mono, monospace" }}>{topic.opportunityScore}</span> : null}
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: topic.priority === "high" ? "#eff6ff" : topic.priority === "medium" ? "#fffbeb" : "#f9fafb", color: topic.priority === "high" ? "#2563eb" : topic.priority === "medium" ? "#d97706" : "#9ca3af" }}>{PRIORITY_LABELS[topic.priority]}</span>
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 6px", lineHeight: 1.4 }}>{topic.title}</h3>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                          <SignalCard label="Search Signals" signal={topic.searchSignals} />
                          <SignalCard label="Content Gap" signal={topic.contentGap} />
                          <SignalCard label="Business Relevance" signal={topic.businessRelevance} />
                        </div>
                        <div className={s.angleHighlight}><span style={{ fontWeight: 600, color: "#2563eb" }}>Góc nội dung: </span>{topic.angle}</div>
                        <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{topic.reasoning}</p>
                      </div>
                      <div className={s.resultActions}>
                        {!added ? <button onClick={() => void handleAddToQueue(topic.id)} disabled={isAdding} style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: isAdding ? "#93c5fd" : "#2563eb", color: "#fff", fontSize: 12, fontWeight: 600, cursor: isAdding ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{isAdding ? "Đang thêm..." : "Thêm vào hàng đợi"}</button> : <><div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#16a34a", whiteSpace: "nowrap" }}>Đã thêm vào hàng đợi</div><button onClick={() => onNavigate("topics")} style={{ padding: "4px 0", background: "none", border: "none", color: "#9ca3af", fontSize: 11, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>Xem hàng đợi →</button></>}
                        <button className={s.deleteSuggestionBtn} onClick={() => void handleDeleteSuggestion(topic)} disabled={deletingIds.has(topic.id)}>{deletingIds.has(topic.id) ? "Đang xóa..." : "Xóa"}</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className={s.autoPanel}>
          <div className={s.autoPanelHeader} style={{ marginBottom: autoEnabled ? 16 : 0 }}>
            <div><h2 className={s.autoPanelTitle}>Tự động khám phá</h2><p className={s.autoPanelSubtitle}>AI chạy định kỳ và đề xuất chủ đề mới.</p></div>
            <button onClick={() => setAutoEnabled((value) => !value)} style={{ width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", background: autoEnabled ? "#2563eb" : "#e5e7eb", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
              <span style={{ position: "absolute", top: 3, left: autoEnabled ? 23 : 3, width: 18, height: 18, borderRadius: 999, background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
            </button>
          </div>
          {autoEnabled ? <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, paddingTop: 2 }}>
            <div><label className={s.fieldLabel}>Tần suất</label><select value={autoFrequency} onChange={(e) => setAutoFrequency(e.target.value)} className={s.select}><option value="daily">Hàng ngày</option><option value="weekly">Hàng tuần</option></select></div>
            <div><label className={s.fieldLabel}>Số đề xuất</label><select value={autoCount} onChange={(e) => setAutoCount(e.target.value)} className={s.select}><option value="5">5 chủ đề</option><option value="10">10 chủ đề</option><option value="20">20 chủ đề</option></select></div>
            <div style={{ display: "flex", alignItems: "flex-end" }}><label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}><input type="checkbox" checked={autoAddToQueue} onChange={(e) => setAutoAddToQueue(e.target.checked)} style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#2563eb" }} /><span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>Tự động thêm chủ đề điểm cao vào hàng đợi</span></label></div>
          </div> : null}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        {toastMsg ? <Toast key={toastKey.current} msg={toastMsg} onDone={() => setToastMsg(null)} /> : null}
      </div>
    </PageShell>
  )
}
