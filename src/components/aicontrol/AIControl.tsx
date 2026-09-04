import { useState } from "react";
import {
  MOCK_AI_RUNS, MOCK_AI_FEEDBACK, AI_QUALITY_TREND,
  type AIRun, type AIFeedbackItem,
} from "../../data/mockData";
import { useIsMobile } from "../../hooks/useIsMobile";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fontSize, fontWeight, colors } from "../../styles/tokens";

type SubTab = "overview" | "runs" | "evaluation" | "feedback";

const SUBTABS: { id: SubTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "runs", label: "AI Runs" },
  { id: "evaluation", label: "Evaluation" },
  { id: "feedback", label: "Feedback" },
];

// ── helpers ────────────────────────────────────────────────────────────────

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, padding: "2px 7px", borderRadius: 4, background: bg, color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: AIRun["status"] }) {
  if (status === "completed") return <Pill label="Hoàn thành" color={colors.status.success} bg={colors.status.successBg} />;
  if (status === "failed") return <Pill label="Thất bại" color={colors.status.error} bg={colors.status.errorBg} />;
  return <Pill label="Một phần" color={colors.status.warning} bg={colors.status.warningBg} />;
}

function KPI({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px" }}>
      <div style={{ fontSize: fontSize.xs, color: colors.text.faint, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: fontWeight.semibold, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: fontWeight.bold, color: highlight ? colors.brand.blue : colors.text.primary, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: fontSize.xs, color: colors.text.faint, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── Overview tab ───────────────────────────────────────────────────────────

function OverviewTab() {
  const isMobile = useIsMobile();
  const totalRuns = MOCK_AI_RUNS.length;
  const completedRuns = MOCK_AI_RUNS.filter((r) => r.status === "completed").length;
  const failedRuns = MOCK_AI_RUNS.filter((r) => r.status === "failed").length;
  const allClaims = MOCK_AI_RUNS.reduce((s, r) => s + r.claimsExtracted, 0);
  const groundedClaims = MOCK_AI_RUNS.reduce((s, r) => s + r.claimsGrounded, 0);
  const thumbsUp = MOCK_AI_FEEDBACK.filter((f) => f.thumbs === "up").length;
  const humanApproval = Math.round((thumbsUp / MOCK_AI_FEEDBACK.length) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12 }}>
        <KPI label="Research Success" value={`${Math.round((completedRuns / totalRuns) * 100)}%`} sub={`${completedRuns}/${totalRuns} runs hoàn thành`} highlight />
        <KPI label="Grounded Claims" value={`${Math.round((groundedClaims / allClaims) * 100)}%`} sub={`${groundedClaims}/${allClaims} claims có evidence`} />
        <KPI label="Human Approval" value={`${humanApproval}%`} sub={`${thumbsUp}/${MOCK_AI_FEEDBACK.length} đánh giá tích cực`} />
        <KPI label="AI Quality Score" value="8.4/10" sub="Trung bình 7 ngày qua" />
      </div>

      {/* Secondary stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Research Runs", value: "1,248", color: colors.text.primary },
          { label: "Failed Runs", value: "37", color: colors.status.error },
          { label: "Unsupported Claims", value: "82", color: colors.status.warning },
          { label: "Needs Human Review", value: "24", color: colors.status.warning },
        ].map((s) => (
          <div key={s.label} style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: fontSize.xs, color: colors.text.faint, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: fontWeight.semibold, marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: fontWeight.bold, color: s.color, fontFamily: "JetBrains Mono, monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quality trend chart */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px" }}>
        <div style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: 14 }}>AI Quality Trend — 7 ngày gần nhất</div>
        <ResponsiveContainer width="99%" height={180}>
          <LineChart data={AI_QUALITY_TREND} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.text.faint }} tickLine={false} axisLine={false} />
            <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: colors.text.faint }} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              contentStyle={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: fontSize.sm, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              formatter={(v) => [`${v}/100`, "AI Quality"]}
            />
            <Line type="monotone" dataKey="score" stroke={colors.brand.blue} strokeWidth={2} dot={{ fill: colors.brand.blue, r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent runs quick view */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text.primary }}>Runs gần nhất</span>
        </div>
        {MOCK_AI_RUNS.slice(0, 3).map((run, i) => (
          <div key={run.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: i < 2 ? `1px solid ${colors.borderSubtle}` : "none" }}>
            <span style={{ fontSize: fontSize.xs, fontFamily: "JetBrains Mono, monospace", color: colors.text.muted, flexShrink: 0 }}>{run.id}</span>
            <span style={{ flex: 1, fontSize: fontSize.base, color: colors.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{run.topicTitle}</span>
            <span style={{ fontSize: fontSize.xs, color: colors.text.faint, flexShrink: 0 }}>{run.duration}s</span>
            <StatusPill status={run.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Runs tab ───────────────────────────────────────────────────────────────

function RunsTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 90px 90px 80px 90px 100px", padding: "10px 20px", borderBottom: "1px solid #f3f4f6", gap: 12 }}>
        {["Run ID", "Topic", "Duration", "Sources", "Claims", "Grounded", "Status"].map((h) => (
          <div key={h} style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.faint, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
        ))}
      </div>

      {MOCK_AI_RUNS.map((run, i) => {
        const expanded = expandedId === run.id;
        return (
          <div key={run.id} style={{ borderBottom: i < MOCK_AI_RUNS.length - 1 ? `1px solid ${colors.borderSubtle}` : "none" }}>
            {/* Row */}
            <div
              onClick={() => setExpandedId(expanded ? null : run.id)}
              style={{ display: "grid", gridTemplateColumns: "100px 1fr 90px 90px 80px 90px 100px", padding: "12px 20px", gap: 12, alignItems: "center", cursor: "pointer", background: expanded ? "#fafafa" : "transparent" }}
              onMouseEnter={(e) => { if (!expanded) (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
              onMouseLeave={(e) => { if (!expanded) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ fontSize: fontSize.xs, fontFamily: "JetBrains Mono, monospace", color: colors.brand.blue }}>{run.id}</span>
              <span style={{ fontSize: fontSize.base, color: colors.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{run.topicTitle}</span>
              <span style={{ fontSize: fontSize.sm, color: colors.text.secondary, fontFamily: "JetBrains Mono, monospace" }}>{run.duration}s</span>
              <span style={{ fontSize: fontSize.sm, color: colors.text.secondary, fontFamily: "JetBrains Mono, monospace" }}>{run.sourcesAccepted}/{run.sourcesFound}</span>
              <span style={{ fontSize: fontSize.sm, color: colors.text.secondary, fontFamily: "JetBrains Mono, monospace" }}>{run.claimsExtracted}</span>
              <span style={{ fontSize: fontSize.sm, fontFamily: "JetBrains Mono, monospace", color: run.claimsGrounded === run.claimsExtracted ? colors.status.success : colors.status.warning }}>
                {run.claimsGrounded}/{run.claimsExtracted}
              </span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <StatusPill status={run.status} />
                <span style={{ fontSize: 10, color: colors.text.faint }}>{expanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* Expanded pipeline */}
            {expanded && (
              <div style={{ padding: "4px 20px 16px", background: "#fafafa" }}>
                <div style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.faint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  Pipeline · {run.model} · {run.promptVersion}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {run.steps.map((step, si) => {
                    const dotColor = step.status === "completed" ? colors.status.success : step.status === "failed" ? colors.status.error : colors.text.disabled;
                    return (
                      <div key={step.id} style={{ display: "flex", gap: 12, paddingBottom: 8 }}>
                        {/* Timeline dot */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ width: 14, height: 14, borderRadius: 99, background: dotColor, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                            {step.status === "completed" && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            {step.status === "failed" && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 2l4 4M6 2L2 6" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg>}
                          </div>
                          {si < run.steps.length - 1 && <div style={{ width: 1, flex: 1, background: "#e5e7eb", minHeight: 8 }} />}
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, paddingBottom: si < run.steps.length - 1 ? 2 : 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: step.status === "skipped" ? colors.text.disabled : colors.text.primary }}>
                              {step.label}
                            </span>
                            {step.duration > 0 && (
                              <span style={{ fontSize: fontSize.xs, color: colors.text.faint, fontFamily: "JetBrains Mono, monospace" }}>{(step.duration / 1000).toFixed(1)}s</span>
                            )}
                          </div>
                          {step.outputSummary && step.status !== "skipped" && (
                            <div style={{ fontSize: fontSize.xs, color: step.status === "failed" ? colors.status.error : colors.text.muted, marginTop: 2 }}>
                              {step.outputSummary}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Evaluation tab ─────────────────────────────────────────────────────────

function EvalBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: fontSize.sm, color: colors.text.secondary }}>{label}</span>
        <span style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color, fontFamily: "JetBrains Mono, monospace" }}>{value}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: "#f3f4f6", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  );
}

function EvaluationTab() {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Reliability badge */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: fontSize.xs, color: colors.text.faint, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: fontWeight.semibold, marginBottom: 4 }}>AI Reliability</div>
          <div style={{ fontSize: 36, fontWeight: fontWeight.bold, color: colors.brand.blue, lineHeight: 1, fontFamily: "JetBrains Mono, monospace" }}>91%</div>
          <div style={{ marginTop: 6, padding: "3px 10px", display: "inline-block", borderRadius: 4, background: colors.brand.blueBg, color: colors.brand.blue, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>High</div>
        </div>
        <div style={{ fontSize: fontSize.sm, color: colors.text.secondary, lineHeight: 1.6 }}>
          Tổng hợp từ AI self-score (35%), System metrics (45%) và Human feedback (20%). Cập nhật sau mỗi run.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>

        {/* AI self-score */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px" }}>
          <div style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
            AI Self-score
            <span style={{ marginLeft: 6, fontSize: 9, color: colors.text.disabled, fontWeight: fontWeight.regular }}>(signal, không phải sự thật)</span>
          </div>
          <EvalBar label="Grounding" value={92} color={colors.brand.blue} />
          <EvalBar label="Completeness" value={88} color={colors.brand.blue} />
          <EvalBar label="Consistency" value={95} color={colors.brand.blue} />
          <EvalBar label="Instruction follow" value={94} color={colors.brand.blue} />
        </div>

        {/* System metrics */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px" }}>
          <div style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>System Metrics</div>
          <EvalBar label="Claims có source" value={91} color={colors.status.success} />
          <EvalBar label="Source quality" value={87} color={colors.status.success} />
          <EvalBar label="Citation correctness" value={89} color={colors.status.success} />
          <EvalBar label="Contradiction rate" value={3} color={colors.status.error} />
          <div style={{ marginTop: 8, fontSize: fontSize.xs, color: colors.text.faint }}>* Contradiction rate: thấp hơn = tốt hơn</div>
        </div>

        {/* Human feedback */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px" }}>
          <div style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Human Feedback</div>
          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>👍</div>
              <div style={{ fontSize: 20, fontWeight: fontWeight.bold, color: colors.status.success, fontFamily: "JetBrains Mono, monospace", marginTop: 4 }}>87%</div>
              <div style={{ fontSize: fontSize.xs, color: colors.text.faint, marginTop: 2 }}>1,085 lượt</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>👎</div>
              <div style={{ fontSize: 20, fontWeight: fontWeight.bold, color: colors.status.error, fontFamily: "JetBrains Mono, monospace", marginTop: 4 }}>13%</div>
              <div style={{ fontSize: fontSize.xs, color: colors.text.faint, marginTop: 2 }}>163 lượt</div>
            </div>
          </div>
          <div style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.faint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Top lý do 👎</div>
          {[
            { label: "Thiếu nguồn", pct: 38 },
            { label: "Điểm cơ hội sai", pct: 27 },
            { label: "Góc nội dung không phù hợp", pct: 19 },
            { label: "Sai thông tin", pct: 16 },
          ].map((r) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: fontSize.xs, color: colors.text.secondary }}>{r.label}</span>
              <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.muted, fontFamily: "JetBrains Mono, monospace" }}>{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Feedback tab ───────────────────────────────────────────────────────────

function FeedbackTab() {
  const [filter, setFilter] = useState<"all" | "up" | "down">("all");
  const filtered = filter === "all" ? MOCK_AI_FEEDBACK : MOCK_AI_FEEDBACK.filter((f) => f.thumbs === filter);
  const upCount = MOCK_AI_FEEDBACK.filter((f) => f.thumbs === "up").length;
  const downCount = MOCK_AI_FEEDBACK.filter((f) => f.thumbs === "down").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Summary */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>👍</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: fontWeight.bold, color: colors.status.success, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>87%</div>
            <div style={{ fontSize: fontSize.xs, color: colors.text.faint, marginTop: 2 }}>1,248 đánh giá</div>
          </div>
        </div>
        <div style={{ width: 1, height: 36, background: colors.border }} />
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "up", "down"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 12px", borderRadius: 5, border: "1px solid",
                borderColor: filter === f ? colors.brand.blue : colors.border,
                background: filter === f ? colors.brand.blueBg : "#fff",
                color: filter === f ? colors.brand.blue : colors.text.muted,
                fontSize: fontSize.sm, fontWeight: filter === f ? fontWeight.semibold : fontWeight.regular,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {f === "all" ? `Tất cả (${MOCK_AI_FEEDBACK.length})` : f === "up" ? `👍 ${upCount}` : `👎 ${downCount}`}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback list */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: colors.text.faint, fontSize: fontSize.base }}>Không có feedback nào.</div>
        ) : filtered.map((fb, i) => (
          <div key={fb.id} style={{ padding: "13px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${colors.borderSubtle}` : "none", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{fb.thumbs === "up" ? "👍" : "👎"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: fb.comment ? 4 : 0 }}>
                <span style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.text.primary }}>{fb.topicTitle}</span>
                {fb.category && (
                  <span style={{ fontSize: fontSize.xs, padding: "1px 6px", borderRadius: 3, background: colors.status.errorBg, color: colors.status.error, fontWeight: fontWeight.medium }}>
                    {fb.category}
                  </span>
                )}
              </div>
              {fb.comment && (
                <div style={{ fontSize: fontSize.sm, color: colors.text.muted, lineHeight: 1.5, fontStyle: "italic" }}>"{fb.comment}"</div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: fontSize.xs, color: colors.text.faint, fontFamily: "JetBrains Mono, monospace" }}>{fb.date}</span>
              <span style={{ fontSize: fontSize.xs, color: colors.brand.blue }}>{fb.runId}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function AIControl() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<SubTab>("overview");

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: isMobile ? "20px 16px 32px" : "28px 32px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: fontWeight.bold, color: colors.text.primary, margin: 0, letterSpacing: "-0.01em" }}>AI Control</h1>
        <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.bold, padding: "2px 7px", borderRadius: 4, background: "#7c3aed20", color: "#7c3aed" }}>Admin</span>
      </div>
      <p style={{ fontSize: fontSize.sm, color: colors.text.faint, margin: "0 0 24px" }}>Giám sát chất lượng AI, debug runs và quản lý đánh giá.</p>

      {/* Sub-tabs */}
      <div style={{ borderBottom: `1px solid ${colors.border}`, marginBottom: 22, display: "flex", gap: 0, overflowX: "auto" }}>
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "9px 16px", background: "none", border: "none",
              borderBottom: `2px solid ${tab === t.id ? colors.brand.blue : "transparent"}`,
              color: tab === t.id ? colors.brand.blue : colors.text.muted,
              fontSize: fontSize.base, fontWeight: tab === t.id ? fontWeight.semibold : fontWeight.regular,
              cursor: "pointer", fontFamily: "inherit", marginBottom: -1, whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview"    && <OverviewTab />}
      {tab === "runs"        && <RunsTab />}
      {tab === "evaluation"  && <EvaluationTab />}
      {tab === "feedback"    && <FeedbackTab />}
    </div>
  );
}
