import { useEffect, useRef, useState } from "react"
import {
  addDiscoveredTopicToQueue,
  createDiscoveryRun,
  deleteDiscoveredTopic,
  getDiscoveryRun,
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

const DISCOVERY_HISTORY_LIMIT = 20
const SIGNAL_COLOR: Record<string, string> = { high: "#16a34a", medium: "#d97706", low: "#9ca3af" }
const PRIORITY_LABELS = {
  high: "Ưu tiên cao",
  medium: "Ưu tiên trung bình",
  low: "Ưu tiên thấp",
} as const

type PeriodDays = 7 | 30 | 90

function capitalizeSignal(level: SignalDetail["level"]): Capitalize<SignalDetail["level"]> {
  return `${level.charAt(0).toUpperCase()}${level.slice(1)}` as Capitalize<SignalDetail["level"]>
}

function capitalizePriority(priority: DiscoveredTopic["priority"]): Capitalize<DiscoveredTopic["priority"]> {
  return `${priority.charAt(0).toUpperCase()}${priority.slice(1)}` as Capitalize<DiscoveredTopic["priority"]>
}

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

  return (
    <div className={`${s.signalCard} ${s[`signal${capitalizeSignal(signal.level)}`]}`} aria-label={`${label}: ${signal.score}/100`}>
      <div className={s.signalLabel}>{label}</div>
      <div className={s.signalScoreRow}>
        <span className={s.signalScore} style={{ color }}>{signal.score}</span>
        <span className={s.signalScoreSuffix}>/100</span>
      </div>
      <div className={s.signalSource} style={{ color }}>{signal.source}</div>
      <div className={s.signalEvidence}>{signal.evidence}</div>
    </div>
  )
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = size / 2 - 4
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? "#2563eb" : score >= 65 ? "#d97706" : "#9ca3af"

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Điểm cơ hội ${score} trên 100`}>
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
    <div className={s.toast}>
      <div className={s.toastIcon}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className={s.toastBody}>
        <div className={s.toastTitle}>Đã thêm vào hàng đợi</div>
        <div className={s.toastMessage}>{msg}</div>
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
    if (results.length === 0) {
      setIsRunning(true)
    }
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
    listDiscoveryRuns(apiClient, workspaceId, DISCOVERY_HISTORY_LIMIT)
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
      <div>
        <div className={s.configPanel}>
          <h2 className={s.configTitle}>Cấu hình khám phá</h2>
          <div className={s.configGrid}>
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

          <button onClick={handleDiscover} disabled={isRunning} className={s.primaryInlineBtn}>
            {isRunning ? <><span className={s.spinner} />Đang gợi ý...</> : <>Gợi ý chủ đề</>}
          </button>

          {isRunning ? <div className={s.helperText}>AI đang tạo danh sách chủ đề. Thường mất vài giây.</div> : null}
          {error ? <div className={`${s.emptyState} ${s.configError}`}>{error}</div> : null}
        </div>

        {hasRun && results.length === 0 && !isRunning ? <div className={s.emptyState}>Chưa có chủ đề phù hợp. Hãy thử thay đổi cấu hình.</div> : null}

        {hasRun && results.length > 0 && (
          <div>
            <div className={s.resultsHeader}>
              <div className={s.resultsHeaderMain}>
                <h2 className={s.resultsTitle}>Lịch sử gợi ý chủ đề</h2>
                <span className={s.countPill}>{results.length} chủ đề</span>
                {addedIds.size > 0 ? <span className={s.addedPill}>✓ {addedIds.size} đã thêm vào hàng đợi</span> : null}
              </div>
              <div className={s.periodText}>{market} · {period} ngày qua</div>
            </div>

            <div className={s.noticeBar}>
              <span>Điểm là dự đoán AI, chưa phải dữ liệu search-volume thực tế. Thêm vào hàng đợi để chuyển sang nghiên cứu.</span>
            </div>

            <div className={s.resultList}>
              {results.map((topic, i) => {
                const added = addedIds.has(topic.id)
                const isAdding = addingIds.has(topic.id)
                return (
                  <div key={topic.id} className={`${s.resultCard} ${added ? s.resultCardAdded : ""}`}>
                    <div className={s.resultCardGrid}>
                      {!isMobile ? <div className={s.scoreColumn}><ScoreRing score={topic.opportunityScore} size={52} /><span className={s.scoreLabel}>Dự đoán</span></div> : null}
                      <div>
                        <div className={s.topicMetaRow}>
                          <span className={s.topicRank}>#{String(i + 1).padStart(2, "0")}</span>
                          {isMobile ? <span className={s.mobileScore}>{topic.opportunityScore}</span> : null}
                          <span className={`${s.priorityPill} ${s[`priority${capitalizePriority(topic.priority)}`]}`}>{PRIORITY_LABELS[topic.priority]}</span>
                        </div>
                        <h3 className={s.resultTitle}>{topic.title}</h3>
                        <div className={s.signalGrid}>
                          <SignalCard label="Search Signals" signal={topic.searchSignals} />
                          <SignalCard label="Content Gap" signal={topic.contentGap} />
                          <SignalCard label="Business Relevance" signal={topic.businessRelevance} />
                        </div>
                        <div className={s.angleHighlight}><span>Góc nội dung: </span>{topic.angle}</div>
                        <p className={s.reasoningText}>{topic.reasoning}</p>
                      </div>
                      <div className={s.resultActions}>
                        {!added ? <button className={s.queueButton} onClick={() => void handleAddToQueue(topic.id)} disabled={isAdding}>{isAdding ? "Đang thêm..." : "Thêm vào hàng đợi"}</button> : <><div className={s.addedText}>Đã thêm vào hàng đợi</div><button className={s.queueLinkButton} onClick={() => onNavigate("topics")}>Xem hàng đợi →</button></>}
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
          <div className={`${s.autoPanelHeader} ${autoEnabled ? s.autoPanelHeaderExpanded : ""}`}>
            <div><h2 className={s.autoPanelTitle}>Tự động khám phá</h2><p className={s.autoPanelSubtitle}>AI chạy định kỳ và đề xuất chủ đề mới.</p></div>
            <button className={`${s.autoToggle} ${autoEnabled ? s.autoToggleActive : ""}`} onClick={() => setAutoEnabled((value) => !value)}>
              <span className={s.autoToggleThumb} />
            </button>
          </div>
          {autoEnabled ? <div className={s.autoGrid}>
            <div><label className={s.fieldLabel}>Tần suất</label><select value={autoFrequency} onChange={(e) => setAutoFrequency(e.target.value)} className={s.select}><option value="daily">Hàng ngày</option><option value="weekly">Hàng tuần</option></select></div>
            <div><label className={s.fieldLabel}>Số đề xuất</label><select value={autoCount} onChange={(e) => setAutoCount(e.target.value)} className={s.select}><option value="5">5 chủ đề</option><option value="10">10 chủ đề</option><option value="20">20 chủ đề</option></select></div>
            <div className={s.autoCheckboxWrap}><label className={s.autoCheckboxLabel}><input type="checkbox" checked={autoAddToQueue} onChange={(e) => setAutoAddToQueue(e.target.checked)} /><span>Tự động thêm chủ đề điểm cao vào hàng đợi</span></label></div>
          </div> : null}
        </div>

        {toastMsg ? <Toast key={toastKey.current} msg={toastMsg} onDone={() => setToastMsg(null)} /> : null}
      </div>
    </PageShell>
  )
}
