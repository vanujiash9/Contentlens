import { MOCK_TOPICS, MOCK_ACTIVITY } from "../../data/mockData";
import { useIsMobile } from "../../hooks/useIsMobile";
import { fontSize, fontWeight, colors, layout, spacing } from "../../styles/tokens";

function fmtDate(iso: string, withTime = false) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  if (!withTime) return `${dd}/${mm}/${yyyy}`;
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function DotStatus({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    completed:  { label: "Hoàn thành", color: "#16a34a" },
    processing: { label: "Đang chạy",  color: "#d97706" },
    failed:     { label: "Thất bại",   color: "#dc2626" },
    pending:    { label: "Chờ xử lý",  color: "#9ca3af" },
  };
  const c = cfg[status] ?? { label: status, color: "#9ca3af" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: c.color, fontSize: fontSize.base, fontWeight: fontWeight.medium }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: c.color, flexShrink: 0, display: "inline-block" }} />
      {c.label}
    </span>
  );
}

const ACTIVITY_LABELS: Record<string, { label: string; dot: string }> = {
  research_done:    { label: "Hoàn thành nghiên cứu",   dot: "#16a34a" },
  topic_added:      { label: "Bắt đầu nghiên cứu",      dot: "#d97706" },
  brief_created:    { label: "Hoàn thành tạo nội dung", dot: "#2563eb" },
  research_failed:  { label: "Nghiên cứu thất bại",     dot: "#dc2626" },
  research_started: { label: "Bắt đầu nghiên cứu",      dot: "#d97706" },
  ai_discovery:     { label: "AI khám phá chủ đề",      dot: "#7c3aed" },
};

const CONTENT_SUFFIXES = [
  ": Đâu là lựa chọn phù hợp?",
  ": Hướng dẫn từ A đến Z",
  ": Có đáng mua không?",
  ": Hướng dẫn chi tiết",
];

export default function Overview({ onNavigate }: { onNavigate: (v: string) => void }) {
  const isMobile = useIsMobile();
  const topics = MOCK_TOPICS;
  const processing = topics.filter((t) => t.status === "processing");
  const completed  = topics.filter((t) => t.status === "completed");
  const failed     = topics.filter((t) => t.status === "failed");

  const recentTopics = [...topics]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const contentItems = completed.slice(0, 4).map((t, i) => ({
    id: t.id,
    title: t.title + CONTENT_SUFFIXES[i % CONTENT_SUFFIXES.length],
    updatedAt: t.updatedAt,
  }));

  const statCards = [
    { label: "Tổng nghiên cứu", value: topics.length,      dot: null,      delta: `+3 so với 7 ngày trước` },
    { label: "Đang chạy",       value: processing.length,  dot: "#d97706", delta: null },
    { label: "Hoàn thành",      value: completed.length,   dot: "#16a34a", delta: null },
    { label: "Thất bại",        value: failed.length,      dot: "#dc2626", delta: null },
  ];

  const col = { padding: "11px 20px" } as const;
  const colH = { padding: "9px 20px", fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.text.faint, whiteSpace: "nowrap" as const, textAlign: "left" as const };

  return (
    <div style={{ padding: isMobile ? spacing.pagePadding.mobile : spacing.pagePadding.desktop, maxWidth: layout.contentWidth + 20, margin: "0 auto" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: fontSize.sm, color: colors.text.muted, margin: "0 0 3px" }}>Xin chào, Nguyễn</p>
          <h1 style={{ fontSize: isMobile ? layout.pageTitleSize.mobile : 28, fontWeight: fontWeight.bold, color: colors.text.primary, margin: "0 0 5px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Tổng quan
          </h1>
          <p style={{ fontSize: fontSize.base, color: colors.text.muted, margin: 0 }}>
            Theo dõi tình trạng các nghiên cứu và nội dung.
          </p>
        </div>
        {!isMobile && (
          <button
            onClick={() => onNavigate("add-topics")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px",
              background: "#111827", color: "#fff",
              borderWidth: 0, borderRadius: 8,
              fontSize: fontSize.base, fontWeight: fontWeight.medium,
              cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
            }}
          >
            + Nghiên cứu mới
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {statCards.map((st) => (
          <div key={st.label} style={{
            background: "#fff",
            borderWidth: 1, borderStyle: "solid", borderColor: colors.border,
            borderRadius: 10, padding: "16px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              {st.dot && <span style={{ width: 7, height: 7, borderRadius: 99, background: st.dot, flexShrink: 0, display: "inline-block" }} />}
              <span style={{ fontSize: fontSize.sm, color: colors.text.muted, fontWeight: fontWeight.medium }}>{st.label}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: colors.text.primary, lineHeight: 1, letterSpacing: "-0.04em" }}>
              {st.value}
            </div>
            {st.delta && (
              <div style={{ fontSize: fontSize.xs, color: colors.status.success, marginTop: 7, fontWeight: fontWeight.medium }}>
                {st.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent research table */}
      <div style={{ background: "#fff", borderWidth: 1, borderStyle: "solid", borderColor: colors.border, borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text.primary, margin: 0 }}>Nghiên cứu gần đây</h2>
          <button
            onClick={() => onNavigate("topics")}
            style={{ fontSize: fontSize.sm, color: colors.brand.blue, borderWidth: 0, background: "transparent", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
          >
            Xem tất cả →
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <th style={{ ...colH, width: 48, textAlign: "center" }}>#</th>
              <th style={{ ...colH }}>Chủ đề</th>
              <th style={{ ...colH }}>Trạng thái</th>
              {!isMobile && <th style={{ ...colH }}>Ngày tạo</th>}
              {!isMobile && <th style={{ ...colH }}>Cập nhật</th>}
              <th style={{ ...colH, width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {recentTopics.map((t, i) => (
              <tr
                key={t.id}
                onClick={() => onNavigate(`topic-${t.id}`)}
                style={{
                  borderBottom: i < recentTopics.length - 1 ? `1px solid ${colors.borderSubtle}` : "none",
                  cursor: "pointer",
                }}
              >
                <td style={{ ...col, textAlign: "center", fontSize: fontSize.sm, color: colors.text.faint }}>{i + 1}</td>
                <td style={{ ...col, fontSize: fontSize.base, color: colors.text.primary, fontWeight: fontWeight.medium, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</td>
                <td style={{ ...col }}><DotStatus status={t.status} /></td>
                {!isMobile && <td style={{ ...col, fontSize: fontSize.sm, color: colors.text.muted, whiteSpace: "nowrap" }}>{fmtDate(t.createdAt)}</td>}
                {!isMobile && <td style={{ ...col, fontSize: fontSize.sm, color: colors.text.muted, whiteSpace: "nowrap" }}>{fmtDate(t.updatedAt, true)}</td>}
                <td style={{ ...col, textAlign: "center" }}>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    style={{ borderWidth: 0, background: "transparent", color: colors.text.faint, cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1, fontFamily: "inherit" }}
                  >
                    ···
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.45fr 1fr", gap: 16 }}>

        {/* Recent content */}
        <div style={{ background: "#fff", borderWidth: 1, borderStyle: "solid", borderColor: colors.border, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text.primary, margin: 0 }}>Nội dung mới nhất</h2>
            <button
              onClick={() => onNavigate("briefs")}
              style={{ fontSize: fontSize.sm, color: colors.brand.blue, borderWidth: 0, background: "transparent", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
            >
              Xem tất cả →
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                <th style={{ ...colH }}>Tiêu đề</th>
                <th style={{ ...colH, width: 80 }}>Loại</th>
                {!isMobile && <th style={{ ...colH, width: 120 }}>Ngày cập nhật</th>}
                <th style={{ ...colH, width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {contentItems.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < contentItems.length - 1 ? `1px solid ${colors.borderSubtle}` : "none" }}>
                  <td style={{ ...col, fontSize: fontSize.base, color: colors.text.primary, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</td>
                  <td style={{ ...col }}>
                    <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, padding: "3px 8px", borderRadius: 5, background: colors.surface.muted, color: colors.text.secondary }}>
                      Bài viết
                    </span>
                  </td>
                  {!isMobile && <td style={{ ...col, fontSize: fontSize.sm, color: colors.text.muted, whiteSpace: "nowrap" }}>{fmtDate(c.updatedAt)}</td>}
                  <td style={{ ...col, textAlign: "center" }}>
                    <button style={{ borderWidth: 0, background: "transparent", color: colors.text.faint, cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1, fontFamily: "inherit" }}>
                      ···
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity */}
        <div style={{ background: "#fff", borderWidth: 1, borderStyle: "solid", borderColor: colors.border, borderRadius: 10, padding: "16px 20px" }}>
          <h2 style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text.primary, margin: "0 0 14px" }}>Hoạt động gần đây</h2>
          <div>
            {MOCK_ACTIVITY.slice(0, 5).map((ev, i) => {
              const cfg = ACTIVITY_LABELS[ev.type] ?? { label: "Sự kiện", dot: "#9ca3af" };
              return (
                <div
                  key={ev.id}
                  style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
                    padding: "10px 0",
                    borderBottom: i < 4 ? `1px solid ${colors.borderSubtle}` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: cfg.dot, flexShrink: 0, marginTop: 5, display: "inline-block" }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.text.primary }}>{cfg.label}</div>
                      <div style={{ fontSize: fontSize.sm, color: colors.text.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.topicTitle}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: fontSize.xs, color: colors.text.faint, whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>{ev.time}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
