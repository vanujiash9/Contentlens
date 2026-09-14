import { useState, useRef } from "react";
import type { CSSProperties } from "react";
import { MOCK_TOPICS, RESEARCH_STEPS, type Topic } from "../../data/mockData";
import { useIsMobile } from "../../hooks/useIsMobile";
import PageShell from "../ui/PageShell";
import { colors, fontSize, fontWeight } from "../../styles/tokens";
import s from "./TopicsQueue.module.css";

interface TopicsQueueProps {
  onNavigate: (view: string) => void;
  extraTopics?: Topic[];
}

function StatusBadge({ status }: { status: Topic["status"] }) {
  const cfg = {
    pending:    { label: "Chờ xử lý",       bg: colors.surface.muted,    color: colors.text.muted },
    processing: { label: "Đang nghiên cứu", bg: colors.status.warningBg, color: colors.status.warning },
    completed:  { label: "Hoàn thành",      bg: colors.status.successBg, color: colors.status.success },
    failed:     { label: "Thất bại",        bg: colors.status.errorBg,   color: colors.status.error },
  };
  const c = cfg[status];
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: fontSize.xs, fontWeight: fontWeight.medium, padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>
      {c.label}
    </span>
  );
}

function actionBtn(bg: string, color: string, border: string): CSSProperties {
  return { padding: "4px 10px", background: bg, color, border: `1px solid ${border}`, borderRadius: 4, fontSize: fontSize.xs, fontWeight: fontWeight.medium, cursor: "pointer", fontFamily: "inherit" };
}

const FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ" },
  { value: "processing", label: "Đang chạy" },
  { value: "completed", label: "Xong" },
  { value: "failed", label: "Lỗi" },
];

export default function TopicsQueue({ onNavigate, extraTopics = [] }: TopicsQueueProps) {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [topics, setTopics] = useState(() => {
    const extraIds = new Set(extraTopics.map((t) => t.id));
    return [...MOCK_TOPICS.filter((t) => !extraIds.has(t.id)), ...extraTopics];
  });
  const timers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Merge any new extraTopics not already in state
  const allTopics = (() => {
    const inState = new Set(topics.map((t) => t.id));
    const newExtra = extraTopics.filter((t) => !inState.has(t.id));
    return newExtra.length ? [...topics, ...newExtra] : topics;
  })();

  const filtered = allTopics.filter((t) => {
    const matchFilter = filter === "all" || t.status === filter;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleStart = (id: string) => {
    setTopics((p) => p.map((t) =>
      t.id === id && t.status === "pending"
        ? { ...t, status: "processing" as const, researchProgress: 0, currentStep: RESEARCH_STEPS[0].label }
        : t
    ));

    let pct = 0;
    const timer = setInterval(() => {
      pct += Math.random() * 7 + 3;
      if (pct >= 100) {
        pct = 100;
        clearInterval(timer);
        timers.current.delete(id);
        setTopics((p) => p.map((t) =>
          t.id === id ? { ...t, status: "completed" as const, researchProgress: 100, currentStep: undefined } : t
        ));
      } else {
        const stepIdx = Math.min(Math.floor((pct / 100) * RESEARCH_STEPS.length), RESEARCH_STEPS.length - 1);
        setTopics((p) => p.map((t) =>
          t.id === id ? { ...t, researchProgress: Math.round(pct), currentStep: RESEARCH_STEPS[stepIdx].label } : t
        ));
      }
    }, 900);

    timers.current.set(id, timer);
  };

  const handleRetry  = (id: string) => setTopics((p) => p.map((t) => t.id === id && t.status === "failed" ? { ...t, status: "pending" as const } : t));
  const handleDelete = (id: string) => {
    const timer = timers.current.get(id);
    if (timer) { clearInterval(timer); timers.current.delete(id); }
    setTopics((p) => p.filter((t) => t.id !== id));
  };

  const headerActions = (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={() => onNavigate("discovery")}
        style={{ padding: "7px 14px", background: "#fff", color: colors.brand.blue, border: `1px solid ${colors.brand.blueBorder}`, borderRadius: 6, fontSize: fontSize.sm, fontWeight: fontWeight.medium, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
      >
        Gợi ý chủ đề
      </button>
      <button
        onClick={() => onNavigate("add-topics")}
        style={{ padding: "7px 14px", background: colors.brand.blue, color: "#fff", border: "none", borderRadius: 6, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, cursor: "pointer", fontFamily: "inherit" }}
      >
        + Thêm chủ đề
      </button>
    </div>
  );

  return (
    <PageShell
      title="Hàng đợi chủ đề"
      subtitle={`${allTopics.length} chủ đề · ${allTopics.filter((t) => t.status === "pending").length} đang chờ`}
      actions={!isMobile ? headerActions : undefined}
    >
      {/* Controls */}
      <div className={s.controlsRow}>
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "7px 12px", border: `1px solid ${colors.border}`, borderRadius: 6,
            fontSize: fontSize.base, color: colors.text.primary, background: "#fff", outline: "none",
            fontFamily: "inherit", flex: isMobile ? "1 1 100%" : "0 0 200px",
          }}
          onFocus={(e) => (e.target.style.borderColor = colors.brand.blue)}
          onBlur={(e) => (e.target.style.borderColor = colors.border)}
        />
        <div className={s.filterBtnRow}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "6px 10px", borderRadius: 5, border: "1px solid",
                borderColor: filter === f.value ? colors.brand.blue : colors.border,
                background: filter === f.value ? colors.brand.blueBg : "#fff",
                color: filter === f.value ? colors.brand.blue : colors.text.muted,
                fontSize: fontSize.sm, fontWeight: filter === f.value ? fontWeight.semibold : fontWeight.regular,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: card list */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: colors.text.faint, fontSize: fontSize.md }}>Không có chủ đề nào.</div>
          ) : filtered.map((topic) => (
            <div key={topic.id} className={s.mobileCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    onClick={() => topic.status === "completed" && onNavigate(`topic-${topic.id}`)}
                    style={{ fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text.primary, lineHeight: 1.4, cursor: topic.status === "completed" ? "pointer" : "default" }}
                  >
                    {topic.title}
                  </div>
                </div>
                {topic.opportunityScore !== undefined && (
                  <span style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.brand.blue, fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>
                    {topic.opportunityScore}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusBadge status={topic.status} />
                  {topic.status === "processing" && topic.currentStep && (
                    <span style={{ fontSize: fontSize.xs, color: colors.status.warning }}>↻ {topic.currentStep}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {topic.status === "completed" && <button onClick={() => onNavigate(`topic-${topic.id}`)} style={actionBtn(colors.brand.blueBg, colors.brand.blue, colors.brand.blueBorder)}>Xem</button>}
                  {topic.status === "pending"   && <button onClick={() => handleStart(topic.id)}          style={actionBtn(colors.status.successBg, colors.status.success, colors.status.successBorder)}>Bắt đầu</button>}
                  {topic.status === "failed"    && <button onClick={() => handleRetry(topic.id)}          style={actionBtn(colors.status.warningBg, colors.status.warning, colors.status.warningBorder)}>Thử lại</button>}
                  <button onClick={() => handleDelete(topic.id)} style={{ padding: "4px 9px", background: "transparent", color: colors.border, border: `1px solid ${colors.borderSubtle}`, borderRadius: 4, fontSize: fontSize.md, cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>×</button>
                </div>
              </div>
              {topic.status === "processing" && topic.researchProgress !== undefined && (
                <div style={{ marginTop: 10 }}>
                  <div className={s.progressTrack} style={{ background: colors.surface.muted }}>
                    <div style={{ height: "100%", width: `${topic.researchProgress}%`, background: "#f59e0b", borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: fontSize.xs, color: colors.text.faint, marginTop: 3, fontFamily: "JetBrains Mono, monospace" }}>{topic.researchProgress}%</div>
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => onNavigate("add-topics")} style={{ width: "100%", padding: "11px", background: colors.brand.blue, color: "#fff", border: "none", borderRadius: 7, fontSize: fontSize.md, fontWeight: fontWeight.semibold, cursor: "pointer", fontFamily: "inherit" }}>
              + Thêm chủ đề
            </button>
          </div>
        </div>
      ) : (
        /* Desktop: table */
        <div className={s.tableContainer}>
          <div className={s.tableHeader}>
            {["Chủ đề", "Trạng thái", "Tiến độ", "Cơ hội", "Ngày tạo", "Hành động"].map((h) => (
              <div key={h} className={s.tableHeaderCell} style={{ color: colors.text.faint }}>{h}</div>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: colors.text.faint, fontSize: fontSize.md }}>Không có chủ đề nào.</div>
          ) : filtered.map((topic, i) => (
            <div
              key={topic.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 140px 120px 90px 120px 110px", padding: "13px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${colors.borderSubtle}` : "none", alignItems: "center", gap: 12 }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  <span
                    onClick={() => topic.status === "completed" && onNavigate(`topic-${topic.id}`)}
                    style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.text.primary, cursor: topic.status === "completed" ? "pointer" : "default", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0, transition: "color 0.1s" }}
                    onMouseEnter={(e) => { if (topic.status === "completed") (e.currentTarget as HTMLElement).style.color = colors.brand.blue; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = colors.text.primary; }}
                  >
                    {topic.title}
                  </span>
                </div>
                {topic.status === "processing" && topic.currentStep && (
                  <div style={{ fontSize: fontSize.xs, color: colors.status.warning, marginTop: 2 }}>↻ {topic.currentStep}</div>
                )}
              </div>
              <div><StatusBadge status={topic.status} /></div>
              <div>
                {topic.status === "processing" && topic.researchProgress !== undefined ? (
                  <div>
                    <div className={s.progressTrack} style={{ background: colors.surface.muted, marginBottom: 3 }}>
                      <div style={{ height: "100%", width: `${topic.researchProgress}%`, background: "#f59e0b", borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: fontSize.xs, color: colors.text.faint, fontFamily: "JetBrains Mono, monospace" }}>{topic.researchProgress}%</div>
                  </div>
                ) : topic.status === "completed" ? (
                  <span style={{ fontSize: fontSize.xs, color: colors.status.success }}>✓ Xong</span>
                ) : (
                  <span style={{ fontSize: fontSize.xs, color: colors.text.disabled }}>—</span>
                )}
              </div>
              <div>
                {topic.opportunityScore !== undefined ? (
                  <span style={{ fontSize: fontSize.base, fontWeight: fontWeight.bold, color: topic.opportunityScore >= 80 ? colors.brand.blue : topic.opportunityScore >= 60 ? colors.status.warning : colors.text.faint, fontFamily: "JetBrains Mono, monospace" }}>
                    {topic.opportunityScore}<span style={{ fontSize: fontSize.base, fontWeight: fontWeight.regular, color: colors.text.disabled }}>/100</span>
                  </span>
                ) : <span style={{ color: colors.text.disabled, fontSize: fontSize.sm }}>—</span>}
              </div>
              <div style={{ fontSize: fontSize.sm, color: colors.text.muted, whiteSpace: "nowrap" }}>
                {new Date(topic.createdAt).toLocaleDateString("vi-VN")}
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {topic.status === "completed" && <button onClick={() => onNavigate(`topic-${topic.id}`)} style={actionBtn(colors.brand.blueBg, colors.brand.blue, colors.brand.blueBorder)}>Xem</button>}
                {topic.status === "pending"   && <button onClick={() => handleStart(topic.id)}          style={actionBtn(colors.status.successBg, colors.status.success, colors.status.successBorder)}>Bắt đầu</button>}
                {topic.status === "failed"    && <button onClick={() => handleRetry(topic.id)}          style={actionBtn(colors.status.warningBg, colors.status.warning, colors.status.warningBorder)}>Thử lại</button>}
                <button onClick={() => handleDelete(topic.id)} style={{ padding: "4px 8px", background: "transparent", color: colors.text.disabled, border: `1px solid ${colors.borderSubtle}`, borderRadius: 4, fontSize: fontSize.base, cursor: "pointer", fontFamily: "inherit" }} title="Xóa">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
