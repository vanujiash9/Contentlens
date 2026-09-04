import { useState } from "react";
import s from "./Sidebar.module.css";
import { colors } from "../../styles/tokens";

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function OverviewIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1.5" y="1.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="8.5" y="1.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="1.5" y="8.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="8.5" y="8.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

function TopicsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <line x1="4" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="4" y1="7.5" x2="13" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="4" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="2" cy="3" r="0.9" fill="currentColor"/>
      <circle cx="2" cy="7.5" r="0.9" fill="currentColor"/>
      <circle cx="2" cy="12" r="0.9" fill="currentColor"/>
    </svg>
  );
}

function OpportunityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <path d="M7.5 1.5L9.1 5.4L13.2 5.8L10.3 8.4L11.2 12.5L7.5 10.4L3.8 12.5L4.7 8.4L1.8 5.8L5.9 5.4L7.5 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
    </svg>
  );
}

function BriefIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3 2.5C3 1.95 3.45 1.5 4 1.5H10.5L13 4V12.5C13 13.05 12.55 13.5 12 13.5H4C3.45 13.5 3 13.05 3 12.5V2.5Z" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="5.5" y1="5.5" x2="10.5" y2="5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="5.5" y1="7.8" x2="10.5" y2="7.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="5.5" y1="10" x2="8.5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

function DiscoveryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="4.2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9.7 9.7L13.2 13.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M6.5 4.5v4M4.5 6.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function SourcesIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <ellipse cx="7.5" cy="7.5" rx="2.2" ry="5.5" stroke="currentColor" strokeWidth="1.1"/>
      <line x1="2" y1="5" x2="13" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <line x1="2" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.1 3.1l1.06 1.06M10.84 10.84l1.06 1.06M3.1 11.9l1.06-1.06M10.84 4.16l1.06-1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

// ── Nav item ───────────────────────────────────────────────────────────────

function NavItem({
  label, icon: Icon, isActive, onClick,
}: {
  label: string;
  icon: () => React.ReactElement;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 10px",
        borderRadius: 7,
        borderWidth: 0,
        background: isActive
          ? "rgba(255,255,255,0.09)"
          : hov
          ? "rgba(255,255,255,0.045)"
          : "transparent",
        color: isActive ? "#e8f0fb" : hov ? "#aabdd4" : "#5d7a96",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: isActive ? 500 : 400,
        fontFamily: "inherit",
        textAlign: "left",
        letterSpacing: "0.005em",
        transition: "background 0.12s, color 0.12s",
      }}
    >
      <span style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: 5,
        background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
        flexShrink: 0,
        transition: "background 0.12s",
      }}>
        <Icon />
      </span>
      {label}
    </button>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

export default function Sidebar({ activeView, onNavigate, onLogout }: SidebarProps) {
  const isTopicDetail = activeView.startsWith("topic-");

  const active = (id: string) => {
    if (id === "research") return activeView === "topics" || isTopicDetail || activeView === "add-topics" || activeView === "discovery";
    if (id === "content") return activeView === "briefs";
    return activeView === id;
  };

  return (
    <aside className={s.aside}>

      {/* Logo */}
      <div style={{ padding: "16px 12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(145deg, #1e40af 0%, #2563eb 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 2px 10px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2.5L13.5 5.5V10.5L8 13.5L2.5 10.5V5.5L8 2.5Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" fill="rgba(255,255,255,0.1)"/>
              <path d="M8 2.5V13.5M2.5 5.5L8 8.5L13.5 5.5" stroke="white" strokeWidth="1.1" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#dce8f8", lineHeight: 1.25, letterSpacing: "-0.025em" }}>
              ContentLens
            </div>
            <div style={{ fontSize: 10, color: "#2e4a65", marginTop: 1, letterSpacing: "0.025em" }}>
              Piano Research
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <NavItem label="Tổng quan"  icon={OverviewIcon}    isActive={active("overview")}  onClick={() => onNavigate("overview")} />
          <NavItem label="Nghiên cứu" icon={TopicsIcon}      isActive={active("research")}  onClick={() => onNavigate("topics")} />
          <NavItem label="Nội dung"   icon={BriefIcon}       isActive={active("content")}   onClick={() => onNavigate("briefs")} />
        </div>
        <div style={{ flex: 1 }} />
      </nav>

      {/* Bottom: user + settings */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* User display */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 10px 6px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(145deg, #1e3a5f, #1a2d48)",
            borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa" }}>N</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#cad9f0", lineHeight: 1.3 }}>Nguyễn</div>
            <div style={{ fontSize: 10, color: "#2e4a65", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Piano Studio
            </div>
          </div>
        </div>
        {/* Settings */}
        <NavItem label="Cài đặt" icon={SettingsIcon} isActive={false} onClick={() => onNavigate("overview")} />
        <div style={{ height: 6 }} />
      </div>

    </aside>
  );
}

