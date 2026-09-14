import PageShell from "../ui/PageShell";
import { MOCK_TOPICS, MOCK_ACTIVITY } from "../../data/mockData";
import { useIsMobile } from "../../hooks/useIsMobile";
import s from "./Overview.module.css";

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

const STATUS = {
  completed: { label: "Hoàn thành", className: s.green },
  processing: { label: "Đang chạy", className: s.orange },
  failed: { label: "Thất bại", className: s.red },
  pending: { label: "Chờ xử lý", className: s.gray },
} as const;

function DotStatus({ status }: { status: string }) {
  const cfg = STATUS[status as keyof typeof STATUS] ?? { label: status, className: s.gray };
  return <span className={`${s.status} ${cfg.className}`}><i />{cfg.label}</span>;
}

const ACTIVITY_LABELS: Record<string, { label: string; className: string }> = {
  research_done: { label: "Hoàn thành nghiên cứu", className: s.green },
  topic_added: { label: "Tạo chủ đề mới", className: s.blue },
  brief_created: { label: "Cập nhật nội dung", className: s.gray },
  research_failed: { label: "Nghiên cứu thất bại", className: s.red },
  research_started: { label: "Đang chạy nghiên cứu", className: s.orange },
  ai_discovery: { label: "AI khám phá chủ đề", className: s.purple },
};

const CONTENT_SUFFIXES = [
  ": Đâu là lựa chọn phù hợp?",
  ": Hướng dẫn từ A đến Z",
  ": Có đáng mua không?",
  ": Hướng dẫn chi tiết",
];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  review: "Đánh giá",
  comparison: "So sánh",
  article: "Hướng dẫn",
  product: "Danh sách",
};

function QualityChart() {
  const values = [34, 51, 52, 64, 68, 72, 80];
  const labels = ["22/08", "23/08", "24/08", "25/08", "26/08", "27/08", "28/08"];
  const points = values.map((v, i) => `${i * 100 / 6},${100 - v}`).join(" ");
  return (
    <div className={s.chartWrap}>
      <div className={s.yLabels}><span>100</span><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span></div>
      <div className={s.chartArea}>
        <div className={s.gridLines}>{[0,1,2,3,4,5].map(i => <i key={i} />)}</div>
        <svg viewBox="0 0 600 100" preserveAspectRatio="none" className={s.lineChart} aria-label="Biểu đồ chất lượng nghiên cứu">
          <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
          {values.map((v, i) => <circle key={i} cx={i * 100 / 6} cy={100-v} r="2.5" vectorEffect="non-scaling-stroke" />)}
        </svg>
        <div className={s.xLabels}>{labels.map(x => <span key={x}>{x}</span>)}</div>
      </div>
    </div>
  );
}

function StatusDonut({ pending, processing, completed, failed, total }: { pending:number; processing:number; completed:number; failed:number; total:number }) {
  const safe = total || 1;
  const p = (pending / safe) * 100;
  const r = p + (processing / safe) * 100;
  const c = r + (completed / safe) * 100;
  const gradient = `conic-gradient(#9ca3af 0 ${p}%, #f59e0b ${p}% ${r}%, #16a34a ${r}% ${c}%, #ef4444 ${c}% 100%)`;
  const rows = [
    ["Chờ xử lý", pending, s.gray], ["Đang chạy", processing, s.orange],
    ["Hoàn thành", completed, s.green], ["Thất bại", failed, s.red],
  ] as const;
  return <div className={s.donutBody}>
    <div className={s.donut} style={{ background: gradient }}><div><strong>{total}</strong><span>nghiên cứu</span></div></div>
    <div className={s.legend}>{rows.map(([label,value,cls]) => <div className={s.legendRow} key={label}><span className={`${s.legendDot} ${cls}`} /><span>{label}</span><strong>{value}</strong><em>{Math.round((value/safe)*100)}%</em></div>)}</div>
  </div>;
}

export default function Overview({ onNavigate }: { onNavigate: (v: string) => void }) {
  const isMobile = useIsMobile();
  const topics = MOCK_TOPICS;
  const processing = topics.filter((t) => t.status === "processing");
  const completed = topics.filter((t) => t.status === "completed");
  const failed = topics.filter((t) => t.status === "failed");
  const pending = topics.filter((t) => t.status === "pending");
  const recentTopics = [...topics].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5);
  const contentItems = completed.slice(0, 5).map((t, i) => ({ id: t.id, title: t.title + CONTENT_SUFFIXES[i % CONTENT_SUFFIXES.length], updatedAt: t.updatedAt, type: ["comparison", "review", "article", "comparison", "product"][i % 5] }));
  const stats = [
    { label: "Tổng nghiên cứu", value: topics.length, tone: "blue", delta: "+3 so với 7 ngày trước", icon: "▤" },
    { label: "Đang chạy", value: processing.length, tone: "orange", delta: "+1 so với 7 ngày trước", icon: "◷" },
    { label: "Hoàn thành", value: completed.length, tone: "green", delta: "+1 so với 7 ngày trước", icon: "✓" },
    { label: "Thất bại", value: failed.length, tone: "red", delta: "-1 so với 7 ngày trước", icon: "×" },
  ];

  const headerActions = !isMobile ? (
    <div className={s.headerActions}>
      <button className={s.dateBtn}>▣&nbsp;&nbsp;22/08/2026 - 28/08/2026⌄</button>
      <button className={s.primaryBtn} onClick={() => onNavigate("add-topics")}>+ Nghiên cứu mới</button>
    </div>
  ) : undefined;

  return (
    <PageShell
      title="Tổng quan"
      subtitle="Theo dõi tình trạng các nghiên cứu và nội dung của bạn."
      actions={headerActions}
    >
      <section className={s.statsGrid}>
        {stats.map((st) => <div className={s.statCard} key={st.label}><div className={`${s.statIcon} ${s[st.tone]}`}>{st.icon}</div><div><div className={s.statLabel}>{st.label}</div><strong className={s.statValue}>{st.value}</strong><div className={`${s.statDelta} ${st.tone === "red" ? s.redText : s.greenText}`}>{st.tone === "red" ? "↓" : "↑"} {st.delta}</div></div></div>)}
      </section>

      <section className={s.chartsGrid}>
        <div className={s.card}><div className={s.cardHeader}><div><h2>Chất lượng nghiên cứu theo thời gian</h2><p>Điểm chất lượng trung bình của các nghiên cứu hoàn thành.</p></div><button className={s.softBtn}>7 ngày qua⌄</button></div><QualityChart /></div>
        <div className={s.card}><div className={s.cardHeader}><div><h2>Phân bố trạng thái nghiên cứu</h2></div></div><StatusDonut pending={pending.length} processing={processing.length} completed={completed.length} failed={failed.length} total={topics.length} /></div>
      </section>

      <section className={s.tablesGrid}>
        <div className={s.card}><div className={s.cardTitleRow}><h2>Nghiên cứu gần đây</h2><button onClick={() => onNavigate("topics")}>Xem tất cả →</button></div><div className={s.tableScroll}><table><thead><tr><th>#</th><th>Chủ đề</th><th>Trạng thái</th><th>Ngày tạo</th><th>Cập nhật</th><th /></tr></thead><tbody>{recentTopics.map((t, i) => <tr key={t.id} onClick={() => onNavigate(`topic-${t.id}`)}><td>{i + 1}</td><td className={s.topicCell}>{t.title}</td><td><DotStatus status={t.status} /></td><td>{fmtDate(t.createdAt)}</td><td>{fmtDate(t.updatedAt, true)}</td><td>···</td></tr>)}</tbody></table></div></div>
        <div className={s.card}><div className={s.cardTitleRow}><h2>Nội dung mới nhất</h2><button onClick={() => onNavigate("briefs")}>Xem tất cả →</button></div><div className={s.tableScroll}><table><thead><tr><th>Tiêu đề</th><th>Loại</th><th>Ngày cập nhật</th></tr></thead><tbody>{contentItems.map((c) => <tr key={c.id}><td className={s.topicCell}>#&nbsp; {c.title}</td><td><span className={`${s.typeBadge} ${s[`type_${c.type}`]}`}>{CONTENT_TYPE_LABELS[c.type]}</span></td><td>{fmtDate(c.updatedAt)}</td></tr>)}</tbody></table></div></div>
      </section>

      <section className={`${s.card} ${s.activityCard}`}><div className={s.cardTitleRow}><h2>Hoạt động gần đây</h2><button>Xem tất cả →</button></div><div className={s.activityTimeline}>{MOCK_ACTIVITY.slice(0, 5).map((ev, i) => { const cfg = ACTIVITY_LABELS[ev.type] ?? { label: "Sự kiện", className: s.gray }; return <div className={s.activityRow} key={ev.id}><div className={s.activityDotCol}><i className={cfg.className} />{i < 4 && <span />}</div><div className={s.activityText}><strong>{cfg.label}</strong><small>{ev.topicTitle}</small></div><time>{ev.time}</time></div>; })}</div></section>
    </PageShell>
  );
}
