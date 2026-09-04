import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { spacing } from "../../styles/tokens";
import s from "./AddTopics.module.css";

interface AddTopicsProps {
  onBack: () => void;
  onAdd: (topics: string[]) => void;
}

const EXAMPLE = "Yamaha U3\nKawai K300\nYamaha U1 vs Yamaha U3\nBest piano for beginners";

export default function AddTopics({ onBack, onAdd }: AddTopicsProps) {
  const isMobile = useIsMobile();
  const [value, setValue] = useState("");
  const [added, setAdded] = useState(false);

  const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);

  const handleSubmit = () => {
    if (!lines.length) return;
    onAdd(lines);
    setAdded(true);
    setTimeout(() => onBack(), 1200);
  };

  const P = isMobile ? spacing.pagePadding.mobile : spacing.pagePadding.desktop;

  return (
    <div className={s.wrapper} style={{ padding: P }}>
      <button onClick={onBack} className={s.backBtn}>← Quay lại</button>

      <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#111827", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
        Thêm chủ đề
      </h1>
      <p className={s.subtitle}>
        Mỗi dòng là một chủ đề. AI sẽ bắt đầu nghiên cứu khi bạn nhấn "Bắt đầu" trong hàng đợi.
      </p>

      <div className={s.textareaCard}>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={"Nhập chủ đề, mỗi dòng một chủ đề...\n\nVí dụ:\nYamaha U3\nKawai K300\nBest piano for beginners"}
          rows={isMobile ? 7 : 9}
          className={s.textarea}
          style={{ fontSize: isMobile ? 14 : 13 }}
        />
        {lines.length > 0 && (
          <div className={s.textareaFooter}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{lines.length} chủ đề</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {lines.slice(0, 2).map((l, i) => (
                <span key={i} className={s.previewChip}>
                  {l.length > 18 ? l.slice(0, 18) + "…" : l}
                </span>
              ))}
              {lines.length > 2 && <span style={{ fontSize: 11, color: "#9ca3af" }}>+{lines.length - 2}</span>}
            </div>
          </div>
        )}
      </div>

      <div className={s.exampleBox}>
        <div className={s.exampleLabel}>Ví dụ</div>
        <pre className={s.examplePre}>{EXAMPLE}</pre>
        <button onClick={() => setValue(EXAMPLE)} className={s.useExampleBtn}>
          Dùng ví dụ này
        </button>
      </div>

      <div className={s.actions} style={{ flexDirection: isMobile ? "column" : "row" }}>
        <button
          onClick={handleSubmit}
          disabled={!lines.length || added}
          style={{
            padding: "10px 20px",
            background: added ? "#16a34a" : lines.length ? "#2563eb" : "#e5e7eb",
            color: lines.length || added ? "#fff" : "#9ca3af",
            border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600,
            cursor: lines.length ? "pointer" : "default", fontFamily: "inherit",
            flex: isMobile ? "1 1 auto" : "none",
            transition: "background 0.2s",
          }}
        >
          {added ? "✓ Đã thêm thành công!" : `Thêm ${lines.length > 0 ? lines.length + " " : ""}chủ đề`}
        </button>
        <button onClick={onBack} className={s.cancelBtn}>Hủy</button>
      </div>
    </div>
  );
}
