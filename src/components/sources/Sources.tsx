import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { MOCK_DOMAINS, type DomainEntry, type DomainTrust } from "../../data/mockData";
import { useIsMobile } from "../../hooks/useIsMobile";
import PageShell from "../ui/PageShell";
import { Card, CardHeader } from "../ui/Card";
import { fontSize, fontWeight, colors } from "../../styles/tokens";
import s from "./Sources.module.css";

// ── Sub-components ─────────────────────────────────────────────────────────

function TrustBadge({ trust }: { trust: DomainTrust }) {
  const cfg = {
    trusted: { label: "Tin cậy", bg: colors.status.successBg, color: colors.status.success },
    blocked: { label: "Đã chặn", bg: colors.status.errorBg,   color: colors.status.error },
    neutral: { label: "Chưa đánh giá", bg: colors.surface.muted, color: colors.text.muted },
  };
  const c = cfg[trust];
  return (
    <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, padding: "2px 7px", borderRadius: 4, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = {
    review: "Review", forum: "Forum", news: "Tin tức",
    official: "Chính thức", comparison: "So sánh", academic: "Học thuật",
  };
  return (
    <span style={{ fontSize: fontSize.xs, color: colors.text.muted, background: colors.surface.muted, padding: "2px 6px", borderRadius: 3 }}>
      {labels[category] ?? category}
    </span>
  );
}

function LangBadge({ language }: { language: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    vi: { label: "VI", color: "#dc2626" },
    en: { label: "EN", color: "#2563eb" },
    both: { label: "VI/EN", color: "#6b7280" },
  };
  const c = cfg[language] ?? cfg.both;
  return (
    <span style={{ fontSize: 10, fontWeight: fontWeight.bold, color: c.color, fontFamily: "JetBrains Mono, monospace" }}>
      {c.label}
    </span>
  );
}

function RelevanceBar({ score }: { score: number }) {
  const color = score >= 85 ? colors.status.success : score >= 70 ? colors.brand.blue : score >= 55 ? colors.status.warning : colors.text.faint;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 48, height: 4, borderRadius: 99, background: colors.surface.muted, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color, fontFamily: "JetBrains Mono, monospace", minWidth: 24 }}>
        {score}
      </span>
    </div>
  );
}

function TrustToggle({ trust, onChange }: { trust: DomainTrust; onChange: (t: DomainTrust) => void }) {
  const options: { value: DomainTrust; label: string; color: string; bg: string }[] = [
    { value: "trusted", label: "Tin cậy", color: colors.status.success, bg: colors.status.successBg },
    { value: "neutral", label: "Trung lập", color: colors.text.muted, bg: colors.surface.muted },
    { value: "blocked", label: "Chặn", color: colors.status.error, bg: colors.status.errorBg },
  ];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={(e) => { e.stopPropagation(); onChange(opt.value); }}
          style={{
            padding: "3px 9px", borderRadius: 4, border: "1px solid",
            borderColor: trust === opt.value ? opt.color : colors.border,
            background: trust === opt.value ? opt.bg : "#fff",
            color: trust === opt.value ? opt.color : colors.text.faint,
            fontSize: fontSize.xs, fontWeight: trust === opt.value ? fontWeight.semibold : fontWeight.regular,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────

function ChartTip({ active, payload }: { active?: boolean; payload?: { value: number; payload: { domain: string } }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 6, padding: "8px 12px", fontSize: fontSize.sm }}>
      <div style={{ fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: 2 }}>{payload[0].payload.domain}</div>
      <div style={{ color: colors.text.muted }}>{payload[0].value} lượt truy cập</div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function Sources() {
  const isMobile = useIsMobile();
  const [domains, setDomains] = useState<DomainEntry[]>(MOCK_DOMAINS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "trusted" | "neutral" | "blocked">("all");
  const [search, setSearch] = useState("");

  const totalVisits = domains.reduce((sm, d) => sm + d.visitCount, 0);
  const trustedCount = domains.filter((d) => d.trust === "trusted").length;
  const blockedCount = domains.filter((d) => d.trust === "blocked").length;
  const avgRelevanceAll = Math.round(
    domains.reduce((sm, d) => sm + d.avgRelevance * d.visitCount, 0) / totalVisits
  );

  const setTrust = (domain: string, trust: DomainTrust) => {
    setDomains((prev) => prev.map((d) => d.domain === domain ? { ...d, trust } : d));
  };

  const filtered = domains
    .filter((d) => filter === "all" || d.trust === filter)
    .filter((d) => d.domain.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.visitCount - a.visitCount);

  // Bar chart data — top 8 domains by visit count
  const chartData = [...domains]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 8)
    .map((d) => ({
      domain: d.domain.replace(".com", "").replace(".vn", "").replace(".net", ""),
      fullDomain: d.domain,
      visits: d.visitCount,
      trust: d.trust,
    }));

  return (
    <PageShell
      title="Nguồn tham khảo"
      subtitle="Các website AI thường xuyên truy cập trong quá trình nghiên cứu"
    >
      {/* ── Stat summary ── */}
      <div className={s.statGrid} style={{ gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 8 : 12 }}>
        {[
          { label: "Tổng lượt truy cập", value: totalVisits, color: colors.text.primary, bg: "#fff" },
          { label: "Số domain",          value: domains.length, color: colors.brand.blue, bg: colors.brand.blueBg },
          { label: "Domain tin cậy",     value: trustedCount, color: colors.status.success, bg: colors.status.successBg },
          { label: "Relevance trung bình", value: `${avgRelevanceAll}%`, color: colors.brand.blue, bg: "#fff" },
        ].map((st) => (
          <div key={st.label} className={s.statCard} style={{ background: st.bg, padding: isMobile ? "12px 14px" : "14px 18px" }}>
            <div className={s.statLabel} style={{ color: colors.text.faint }}>{st.label}</div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: fontWeight.bold, color: st.color, lineHeight: 1, fontFamily: "JetBrains Mono, monospace" }}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* ── Frequency chart ── */}
      <Card padding="16px 20px" style={{ marginBottom: 16 }}>
        <CardHeader title="Tần suất truy cập theo domain" />
        <ResponsiveContainer width="99%" height={200}>
          <BarChart data={chartData} margin={{ left: -8, right: 8, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
            <XAxis dataKey="domain" tick={{ fontSize: 11, fill: colors.text.muted }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: colors.text.faint }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="visits" name="Lượt truy cập" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.trust === "trusted" ? colors.brand.blue :
                    entry.trust === "blocked" ? colors.status.error :
                    colors.text.faint
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className={s.chartLegend}>
          {[
            { color: colors.brand.blue, label: "Tin cậy" },
            { color: colors.text.faint, label: "Chưa đánh giá" },
            { color: colors.status.error, label: "Đã chặn" },
          ].map((l) => (
            <div key={l.label} className={s.legendItem}>
              <span className={s.legendSwatch} style={{ background: l.color }} />
              <span style={{ fontSize: fontSize.xs, color: colors.text.muted }}>{l.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Controls ── */}
      <div className={s.controlsRow}>
        <input
          type="text"
          placeholder="Tìm domain..."
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
          {([
            { value: "all",     label: "Tất cả" },
            { value: "trusted", label: "Tin cậy" },
            { value: "neutral", label: "Chưa đánh giá" },
            { value: "blocked", label: "Đã chặn" },
          ] as const).map((f) => (
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
        <span style={{ fontSize: fontSize.xs, color: colors.text.faint, marginLeft: "auto" }}>
          {filtered.length} domain
        </span>
      </div>

      {/* ── Domain list ── */}
      <div className={s.domainList}>
        {filtered.map((d) => {
          const isExpanded = expanded === d.domain;
          return (
            <div
              key={d.domain}
              className={s.domainCard}
              style={{
                background: d.trust === "blocked" ? "#fef2f2" : "#fff",
                border: `1px solid ${d.trust === "blocked" ? colors.status.errorBorder : colors.border}`,
                opacity: d.trust === "blocked" ? 0.7 : 1,
              }}
            >
              {/* Domain header row */}
              <div
                onClick={() => setExpanded(isExpanded ? null : d.domain)}
                className={s.domainHeaderRow}
                style={{ gridTemplateColumns: isMobile ? "1fr auto" : "1.6fr 80px 100px 160px auto", display: "grid" }}
                onMouseEnter={(e) => { if (d.trust !== "blocked") (e.currentTarget.style.background = colors.surface.subtle); }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Domain name + badges */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className={s.domainName} style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text.primary }}>
                      {d.domain}
                    </span>
                    <CategoryBadge category={d.category} />
                    <LangBadge language={d.language} />
                    <TrustBadge trust={d.trust} />
                  </div>
                  {isMobile && (
                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: fontSize.xs, color: colors.text.muted }}>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: fontWeight.bold, color: colors.text.primary }}>{d.visitCount}</span> lượt
                      </span>
                      <RelevanceBar score={d.avgRelevance} />
                    </div>
                  )}
                </div>

                {!isMobile && (
                  <>
                    {/* Visit count */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary, lineHeight: 1, fontFamily: "JetBrains Mono, monospace" }}>
                        {d.visitCount}
                      </div>
                      <div className={s.visitLabel} style={{ fontSize: fontSize.xs, color: colors.text.faint }}>lượt</div>
                    </div>

                    {/* Avg relevance */}
                    <div>
                      <div className={s.relevanceLabel} style={{ color: colors.text.faint }}>Relevance TB</div>
                      <RelevanceBar score={d.avgRelevance} />
                    </div>

                    {/* Trust toggle */}
                    <TrustToggle trust={d.trust} onChange={(t) => setTrust(d.domain, t)} />
                  </>
                )}

                {/* Expand chevron */}
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: colors.text.faint }}
                >
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Mobile trust toggle */}
              {isMobile && (
                <div className={s.mobileTrustRow} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                  <div className={s.mobileTrustInner}>
                    <TrustToggle trust={d.trust} onChange={(t) => setTrust(d.domain, t)} />
                  </div>
                </div>
              )}

              {/* Expanded: recent sources */}
              {isExpanded && (
                <div className={s.expandedSection} style={{ borderTopColor: colors.borderSubtle, background: colors.surface.subtle }}>
                  <div className={s.expandedHeader} style={{ color: colors.text.faint }}>
                    Nguồn gần đây từ domain này ({d.recentSources.length})
                  </div>
                  {d.recentSources.map((src, i) => (
                    <div
                      key={src.id}
                      className={s.sourceRow}
                      style={{ borderTop: i > 0 ? `1px solid ${colors.borderSubtle}` : "none" }}
                    >
                      {/* Relevance indicator */}
                      <div
                        className={s.sourceRelevanceBox}
                        style={{
                          background: src.relevance >= 85 ? colors.status.successBg : src.relevance >= 70 ? colors.brand.blueBg : colors.surface.muted,
                        }}
                      >
                        <span style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: src.relevance >= 85 ? colors.status.success : src.relevance >= 70 ? colors.brand.blue : colors.text.faint, fontFamily: "JetBrains Mono, monospace" }}>
                          {src.relevance}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: fontSize.base, color: colors.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                          {src.title}
                        </div>
                        <div style={{ fontSize: fontSize.xs, color: colors.text.faint }}>
                          Chủ đề: {src.topicTitle} · {src.date}
                        </div>
                      </div>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: fontSize.xs, color: colors.brand.blue, fontWeight: fontWeight.medium, flexShrink: 0 }}
                      >
                        Mở ↗
                      </a>
                    </div>
                  ))}
                  <div className={s.expandedFooter} style={{ fontSize: fontSize.xs, color: colors.text.faint }}>
                    Cập nhật lần cuối: {d.lastVisited}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Blocked domains notice ── */}
      {blockedCount > 0 && (
        <div className={s.blockedNotice} style={{ background: colors.status.errorBg, border: `1px solid ${colors.status.errorBorder}`, fontSize: fontSize.base, color: colors.status.error }}>
          <span style={{ fontWeight: fontWeight.semibold }}>{blockedCount} domain đã bị chặn.</span>
          {" "}AI sẽ bỏ qua các nguồn từ domain này trong các phiên nghiên cứu tiếp theo.
        </div>
      )}
    </PageShell>
  );
}
