import { useEffect, useRef, useState } from "react";
import PageShell from "../ui/PageShell";
import { MOCK_DISCOVERED, type DiscoveredTopic, type SignalDetail } from "../../data/mockData";
import { useIsMobile } from "../../hooks/useIsMobile";
import { layout } from "../../styles/tokens";
import s from "./TopicDiscovery.module.css";

interface TopicDiscoveryProps {
  onNavigate: (view: string) => void;
  onAddToQueue?: (topic: DiscoveredTopic) => void;
}

const SIGNAL_COLOR: Record<string, string> = { high: "#16a34a", medium: "#d97706", low: "#9ca3af" };
const SIGNAL_BORDER: Record<string, string> = { high: "#bbf7d0", medium: "#fde68a", low: "#e5e7eb" };
const SIGNAL_BG: Record<string, string> = { high: "#f0fdf4", medium: "#fffbeb", low: "#f9fafb" };
const PRIORITY_LABELS = {
  high: "Ưu tiên cao",
  medium: "Ưu tiên trung bình",
  low: "Ưu tiên thấp",
} as const;

function SignalCard({ label, signal }: { label: string; signal: SignalDetail }) {
  const color = SIGNAL_COLOR[signal.level];
  const bg = SIGNAL_BG[signal.level];
  const border = SIGNAL_BORDER[signal.level];

  return (
    <div
      style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", minWidth: 140, flex: "1 1 140px" }}
      aria-label={`${label}: ${signal.score}/100`}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 3 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1, fontFamily: "JetBrains Mono, monospace" }}>
          {signal.score}
        </span>
        <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "JetBrains Mono, monospace" }}>/100</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color, marginBottom: 3 }}>{signal.source}</div>
      <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.4 }}>{signal.evidence}</div>
    </div>
  );
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#2563eb" : score >= 65 ? "#d97706" : "#9ca3af";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }} aria-label={`Điểm cơ hội ${score} trên 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 11, fontWeight: 700, fill: color, fontFamily: "JetBrains Mono, monospace" }}
      >
        {score}
      </text>
    </svg>
  );
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDone, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 1000,
        background: "#111827",
        color: "#fff",
        borderRadius: 10,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 4px 28px rgba(0,0,0,0.3)",
        animation: "slideUp 0.22s ease",
        maxWidth: 340,
        pointerEvents: "none",
      }}
    >
      <div style={{ width: 20, height: 20, borderRadius: 999, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>Đã thêm vào hàng đợi</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {msg}
        </div>
      </div>
    </div>
  );
}

export default function TopicDiscovery({ onNavigate, onAddToQueue }: TopicDiscoveryProps) {
  const isMobile = useIsMobile();
  const [industry, setIndustry] = useState("Piano & nhạc cụ phím");
  const [market, setMarket] = useState("Việt Nam");
  const [period, setPeriod] = useState("30");
  const [count, setCount] = useState("10");

  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);
  const [progress, setProgress] = useState(100);
  const [results, setResults] = useState<DiscoveredTopic[]>(MOCK_DISCOVERED);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set(["d001"]));

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastKey = useRef(0);
  const runTimerRef = useRef<number | null>(null);
  const doneTimerRef = useRef<number | null>(null);

  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoFrequency, setAutoFrequency] = useState("weekly");
  const [autoCount, setAutoCount] = useState("10");
  const [autoAddToQueue, setAutoAddToQueue] = useState(false);

  const clearTimers = () => {
    if (runTimerRef.current != null) {
      window.clearInterval(runTimerRef.current);
      runTimerRef.current = null;
    }
    if (doneTimerRef.current != null) {
      window.clearTimeout(doneTimerRef.current);
      doneTimerRef.current = null;
    }
  };

  useEffect(() => clearTimers, []);

  const handleDiscover = () => {
    clearTimers();
    setIsRunning(true);
    setHasRun(false);
    setProgress(0);
    setResults([]);

    let p = 0;
    runTimerRef.current = window.setInterval(() => {
      p += Math.random() * 18 + 7;
      if (p >= 100) {
        p = 100;
        if (runTimerRef.current != null) {
          window.clearInterval(runTimerRef.current);
          runTimerRef.current = null;
        }
        doneTimerRef.current = window.setTimeout(() => {
          setResults(MOCK_DISCOVERED.slice(0, parseInt(count, 10)));
          setIsRunning(false);
          setHasRun(true);
          setProgress(100);
        }, 400);
      }
      setProgress(Math.min(p, 100));
    }, 200);
  };

  const handleAddToQueue = (id: string) => {
    setAddedIds((prev) => new Set([...prev, id]));
    const topic = results.find((item) => item.id === id);
    if (!topic) return;

    onAddToQueue?.(topic);
    toastKey.current += 1;
    setToastMsg(topic.title);
  };

  return (
    <PageShell title="Gợi ý chủ đề" subtitle="Tìm nhanh chủ đề có tiềm năng nghiên cứu cao." maxWidth={layout.contentWidth}>
      <div style={{ width: "100%" }}>
        <div className={s.configPanel}>
          <h2 className={s.configTitle}>Cấu hình khám phá</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 120px 120px", gap: 12, marginBottom: 16 }}>
            <div>
              <label className={s.fieldLabel}>Lĩnh vực</label>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={s.input}
                placeholder="Vd: Piano & nhạc cụ phím"
                onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div>
              <label className={s.fieldLabel}>Thị trường</label>
              <input
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className={s.input}
                placeholder="Vd: Việt Nam"
                onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div>
              <label className={s.fieldLabel}>Khoảng thời gian</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className={s.select}>
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

          <button
            onClick={handleDiscover}
            disabled={isRunning}
            style={{
              padding: "9px 20px",
              background: isRunning ? "#93c5fd" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: isRunning ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isRunning ? (
              <>
                <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: 999, animation: "spin 0.7s linear infinite" }} />
                Đang gợi ý...
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="5.5" cy="5.5" r="4" stroke="white" strokeWidth="1.4" />
                  <path d="M8.5 8.5L11.5 11.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M5.5 3.5v4M3.5 5.5h4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Gợi ý chủ đề
              </>
            )}
          </button>

          {isRunning && (
            <div style={{ marginTop: 12 }}>
              <div className={s.progressBar}>
                <div style={{ height: "100%", width: `${progress}%`, background: "#2563eb", borderRadius: 99, transition: "width 0.2s ease" }} />
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
                {Math.round(progress)}% — Phân tích xu hướng tìm kiếm...
              </div>
            </div>
          )}
        </div>

        {hasRun && results.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className={s.resultsHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Kết quả khám phá</h2>
                <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "2px 7px", borderRadius: 4 }}>
                  {results.length} chủ đề
                </span>
                {addedIds.size > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: 4 }}>
                    ✓ {addedIds.size} đã thêm vào hàng đợi
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                {market} · {period} ngày qua
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="6.5" cy="6.5" r="5.5" stroke="#9ca3af" strokeWidth="1.2" />
                <path d="M6.5 4v3.5" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="6.5" cy="9.5" r="0.6" fill="#9ca3af" />
              </svg>
              <span style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
                Điểm là dự đoán từ xu hướng tìm kiếm. Thêm vào hàng đợi để chuyển sang nghiên cứu.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results.map((topic, i) => {
                const added = addedIds.has(topic.id);
                const scoreColor = topic.opportunityScore >= 80 ? "#2563eb" : topic.opportunityScore >= 65 ? "#d97706" : "#9ca3af";
                return (
                  <div key={topic.id} className={s.resultCard} style={{ padding: isMobile ? "14px" : "16px 20px", opacity: added ? 0.75 : 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr auto", gap: isMobile ? 10 : 16, alignItems: "start" }}>
                      {!isMobile && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, paddingTop: 2 }}>
                          <ScoreRing score={topic.opportunityScore} size={52} />
                          <span style={{ fontSize: 9, color: "#9ca3af", textAlign: "center" }}>Dự đoán</span>
                        </div>
                      )}

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", fontFamily: "JetBrains Mono, monospace" }}>
                            #{String(i + 1).padStart(2, "0")}
                          </span>
                          {isMobile && (
                            <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor, fontFamily: "JetBrains Mono, monospace" }}>
                              {topic.opportunityScore}
                            </span>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: topic.priority === "high" ? "#eff6ff" : topic.priority === "medium" ? "#fffbeb" : "#f9fafb", color: topic.priority === "high" ? "#2563eb" : topic.priority === "medium" ? "#d97706" : "#9ca3af" }}>
                            {PRIORITY_LABELS[topic.priority]}
                          </span>
                        </div>

                        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 6px", lineHeight: 1.4 }}>
                          {topic.title}
                        </h3>

                        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                          <SignalCard label="Search Signals" signal={topic.searchSignals} />
                          <SignalCard label="Content Gap" signal={topic.contentGap} />
                          <SignalCard label="Business Relevance" signal={topic.businessRelevance} />
                        </div>

                        <div className={s.angleHighlight}>
                          <span style={{ fontWeight: 600, color: "#2563eb" }}>Góc nội dung: </span>
                          {topic.angle}
                        </div>

                        <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{topic.reasoning}</p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0, alignItems: "flex-end" }}>
                        {!added ? (
                          <button
                            onClick={() => handleAddToQueue(topic.id)}
                            style={{
                              padding: "7px 14px",
                              borderRadius: 6,
                              border: "none",
                              background: "#2563eb",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "background 0.12s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
                          >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <line x1="5.5" y1="1" x2="5.5" y2="10" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                              <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                            Thêm vào hàng đợi
                          </button>
                        ) : (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#16a34a", whiteSpace: "nowrap" }}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="7" r="6" stroke="#16a34a" strokeWidth="1.3" />
                                <path d="M4.5 7l2 2 3-3" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Đã thêm vào hàng đợi
                            </div>
                            <button
                              onClick={() => onNavigate("topics")}
                              style={{
                                padding: "4px 0",
                                background: "none",
                                border: "none",
                                color: "#9ca3af",
                                fontSize: 11,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                textDecoration: "underline",
                                textUnderlineOffset: 2,
                              }}
                            >
                              Xem hàng đợi →
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={s.autoPanel}>
          <div className={s.autoPanelHeader} style={{ marginBottom: autoEnabled ? 16 : 0 }}>
            <div>
              <h2 className={s.autoPanelTitle}>Tự động khám phá</h2>
              <p className={s.autoPanelSubtitle}>AI chạy định kỳ và đề xuất chủ đề mới.</p>
            </div>
            <button
              onClick={() => setAutoEnabled((value) => !value)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: autoEnabled ? "#2563eb" : "#e5e7eb",
                position: "relative",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: autoEnabled ? 23 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />
            </button>
          </div>

          {autoEnabled && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, paddingTop: 2 }}>
              <div>
                <label className={s.fieldLabel}>Tần suất</label>
                <select value={autoFrequency} onChange={(e) => setAutoFrequency(e.target.value)} className={s.select}>
                  <option value="daily">Hàng ngày</option>
                  <option value="weekly">Hàng tuần</option>
                </select>
              </div>
              <div>
                <label className={s.fieldLabel}>Số đề xuất</label>
                <select value={autoCount} onChange={(e) => setAutoCount(e.target.value)} className={s.select}>
                  <option value="5">5 chủ đề</option>
                  <option value="10">10 chủ đề</option>
                  <option value="20">20 chủ đề</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={autoAddToQueue}
                    onChange={(e) => setAutoAddToQueue(e.target.checked)}
                    style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#2563eb" }}
                  />
                  <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>Tự động thêm chủ đề điểm cao vào hàng đợi</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {toastMsg ? <Toast key={toastKey.current} msg={toastMsg} onDone={() => setToastMsg(null)} /> : null}
      </div>
    </PageShell>
  );
}
