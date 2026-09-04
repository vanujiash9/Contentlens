import { MOCK_TOPICS } from "../../data/mockData";
import { useIsMobile } from "../../hooks/useIsMobile";
import PageShell from "../ui/PageShell";
import { Card } from "../ui/Card";
import { fontSize, fontWeight, colors } from "../../styles/tokens";
import s from "./Opportunities.module.css";

interface OpportunitiesProps {
  onNavigate: (view: string) => void;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className={s.scoreBar} style={{ background: colors.surface.muted }}>
      <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99 }} />
    </div>
  );
}

export default function Opportunities({ onNavigate }: OpportunitiesProps) {
  const isMobile = useIsMobile();

  const withScore = MOCK_TOPICS
    .filter((t) => t.opportunityScore !== undefined && t.status === "completed")
    .sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0));

  const high   = withScore.filter((t) => (t.opportunityScore ?? 0) >= 80);
  const medium = withScore.filter((t) => (t.opportunityScore ?? 0) >= 60 && (t.opportunityScore ?? 0) < 80);
  const low    = withScore.filter((t) => (t.opportunityScore ?? 0) < 60);

  const groups = [
    { label: "Cơ hội cao",        items: high,   color: colors.brand.blue,    bg: colors.brand.blueBg,     border: colors.brand.blueBorder },
    { label: "Cơ hội trung bình", items: medium, color: colors.status.warning, bg: colors.status.warningBg, border: colors.status.warningBorder },
    { label: "Cơ hội thấp",       items: low,    color: colors.text.faint,     bg: colors.surface.subtle,   border: colors.border },
  ].filter((g) => g.items.length > 0);

  return (
    <PageShell
      title="Ưu tiên viết"
      subtitle={`${withScore.length} chủ đề đã nghiên cứu xong · Hôm nay nên viết cái nào?`}
    >
      {/* Summary */}
      <div className={s.summaryRow}>
        {[
          { label: "Cơ hội cao", count: high.length,   color: colors.brand.blue,    bg: colors.brand.blueBg },
          { label: "Trung bình", count: medium.length,  color: colors.status.warning, bg: colors.status.warningBg },
          { label: "Thấp",       count: low.length,     color: colors.text.faint,     bg: colors.surface.subtle },
        ].map((st) => (
          <div key={st.label} className={s.summaryCard} style={{ background: st.bg }}>
            <div className={s.summaryValue} style={{ fontWeight: fontWeight.bold, color: st.color }}>{st.count}</div>
            <div className={s.summaryLabel} style={{ color: colors.text.muted }}>{st.label}</div>
          </div>
        ))}
      </div>

      {groups.map((group) => (
        <div key={group.label} className={s.groupSection}>
          <div className={s.groupHeader}>
            <div className={s.groupDot} style={{ background: group.color }} />
            <h2 className={s.groupTitle} style={{ fontSize: fontSize.base, color: colors.text.secondary }}>{group.label}</h2>
            <span className={s.groupCount} style={{ fontSize: fontSize.sm, color: colors.text.faint }}>{group.items.length} chủ đề</span>
          </div>

          <div className={s.cardList}>
            {group.items.map((topic) => {
              const opp = topic.opportunity;
              return (
                <Card key={topic.id} onClick={() => onNavigate(`topic-${topic.id}`)}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                          <span style={{ fontSize: 26, fontWeight: fontWeight.bold, color: group.color, lineHeight: 1, fontFamily: "JetBrains Mono, monospace" }}>
                            {topic.opportunityScore}
                          </span>
                          <span style={{ fontSize: fontSize.xs, color: colors.text.faint, fontFamily: "JetBrains Mono, monospace" }}>/100</span>
                        </div>
                        <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, padding: "2px 7px", borderRadius: 3, background: group.bg, color: group.color, border: `1px solid ${group.border}` }}>
                          {group.label}
                        </span>
                        {topic.source === "ai" && (
                          <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, padding: "2px 6px", borderRadius: 3, background: colors.status.purpleBg, color: colors.status.purple }}>AI đề xuất</span>
                        )}
                      </div>
                      <h3 style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text.primary, margin: "0 0 6px", lineHeight: 1.4 }}>
                        {topic.title}
                      </h3>
                      {opp?.recommendation && (
                        <p style={{ fontSize: fontSize.base, color: colors.text.muted, margin: "0 0 8px", lineHeight: 1.5 }}>
                          {opp.recommendation}
                        </p>
                      )}
                      {opp?.angle && (
                        <div style={{ fontSize: fontSize.sm, color: colors.text.secondary, padding: "7px 10px", background: "#f8fafc", borderRadius: 5, borderLeft: `3px solid ${colors.brand.blue}`, lineHeight: 1.5 }}>
                          <span style={{ fontWeight: fontWeight.semibold, color: colors.brand.blue }}>Angle: </span>{opp.angle}
                        </div>
                      )}
                    </div>

                    {!isMobile && opp?.breakdown && (
                      <div className={s.breakdownSection}>
                        <div className={s.breakdownLabel} style={{ color: colors.text.faint }}>Chi tiết</div>
                        {opp.breakdown.map((b) => (
                          <div key={b.label} className={s.breakdownRow}>
                            <div className={s.breakdownMeta}>
                              <span style={{ fontSize: fontSize.xs, color: colors.text.muted }}>{b.label}</span>
                              <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: group.color, fontFamily: "JetBrains Mono, monospace" }}>{b.score}</span>
                            </div>
                            <ScoreBar score={b.score} color={group.color} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {opp?.audience && (
                    <div className={s.audienceRow} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                      <span style={{ fontSize: fontSize.xs, color: colors.text.faint }}>
                        <span style={{ fontWeight: fontWeight.medium, color: colors.text.muted }}>Đối tượng: </span>{opp.audience}
                      </span>
                      <span style={{ fontSize: fontSize.sm, color: colors.brand.blue, fontWeight: fontWeight.medium }}>Xem chi tiết →</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {withScore.length === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: 6 }}>Chưa có chủ đề nào nghiên cứu xong</div>
            <div style={{ fontSize: fontSize.base, color: colors.text.faint, marginBottom: 16, lineHeight: 1.6 }}>
              Trang này hiển thị sau khi AI hoàn thành nghiên cứu.<br/>
              Thêm chủ đề vào hàng đợi để bắt đầu.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => onNavigate("discovery")} style={{ padding: "8px 18px", background: colors.brand.blue, color: "#fff", border: "none", borderRadius: 6, fontSize: fontSize.base, fontWeight: fontWeight.semibold, cursor: "pointer", fontFamily: "inherit" }}>
                Khám phá chủ đề mới
              </button>
              <button onClick={() => onNavigate("topics")} style={{ padding: "8px 18px", background: "#fff", color: colors.text.secondary, border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: fontSize.base, cursor: "pointer", fontFamily: "inherit" }}>
                Xem hàng đợi
              </button>
            </div>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
