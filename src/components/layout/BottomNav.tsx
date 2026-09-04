import { useState } from "react";
import s from "./BottomNav.module.css";

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

const navItems = [
  {
    id: "overview", label: "Tổng quan",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.5"/>
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.5"/>
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.5"/>
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "topics", label: "Chủ đề",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <line x1="6" y1="5" x2="17" y2="5" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="6" y1="10" x2="17" y2="10" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="6" y1="15" x2="17" y2="15" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="3" cy="5" r="1.2" fill={active ? "#2563eb" : "#9ca3af"}/>
        <circle cx="3" cy="10" r="1.2" fill={active ? "#2563eb" : "#9ca3af"}/>
        <circle cx="3" cy="15" r="1.2" fill={active ? "#2563eb" : "#9ca3af"}/>
      </svg>
    ),
  },
  {
    id: "add-topics", label: "",
    icon: (_active: boolean) => (
      <div style={{ width: 38, height: 38, borderRadius: 99, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <line x1="9" y1="3" x2="9" y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="3" y1="9" x2="15" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
    ),
  },
  {
    id: "opportunities", label: "Cơ hội",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L12.24 7.01L17.8 7.44L13.8 10.97L15.06 16.46L10 13.5L4.94 16.46L6.2 10.97L2.2 7.44L7.76 7.01L10 2Z" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "__menu", label: "Menu",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3.5" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.5"/>
        <path d="M3.5 18c0-3.59 2.91-5.5 6.5-5.5s6.5 1.91 6.5 5.5" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function BottomNav({ activeView, onNavigate, onLogout }: BottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isTopicDetail = activeView.startsWith("topic-");

  const isActive = (id: string) => {
    if (id === "__menu") return menuOpen;
    if (id === "topics") return activeView === "topics" || isTopicDetail || activeView === "add-topics" || activeView === "discovery";
    return activeView === id;
  };

  return (
    <>
      {/* Menu sheet */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} className={s.overlay} />
          <div className={s.menuSheet}>
            {/* User */}
            <div className={s.menuUser}>
              <div className={s.menuAvatar}>
                <span className={s.menuAvatarInitial}>N</span>
              </div>
              <div>
                <div className={s.menuUserName}>Nguyễn Team</div>
                <div className={s.menuUserEmail}>content@piano.vn</div>
              </div>
            </div>

            {/* Extra nav items */}
            {[
              { id: "briefs", label: "Content Brief", admin: false },
              { id: "discovery", label: "Gợi ý chủ đề", admin: false },
            ].map((item, i, arr) => (
              <div key={item.id}>
                {item.admin && arr[i - 1] && !arr[i - 1].admin && (
                  <div style={{ padding: "6px 16px 2px", fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.07em", background: "#faf5ff", borderBottom: "1px solid #f3e8ff" }}>
                    Admin
                  </div>
                )}
                <button
                  onClick={() => { onNavigate(item.id); setMenuOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "12px 16px",
                    background: activeView === item.id ? (item.admin ? "#faf5ff" : "#eff6ff") : "none",
                    border: "none", borderBottom: "1px solid #f9fafb",
                    textAlign: "left", fontSize: 14,
                    color: activeView === item.id ? (item.admin ? "#7c3aed" : "#2563eb") : "#374151",
                    fontWeight: activeView === item.id ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {item.label}
                  {item.admin && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#7c3aed20", color: "#7c3aed", fontWeight: 700 }}>Admin</span>}
                </button>
              </div>
            ))}

            <button onClick={() => { onLogout(); setMenuOpen(false); }} className={s.menuLogout}>
              Đăng xuất
            </button>
          </div>
        </>
      )}

      {/* Bottom bar */}
      <nav className={s.nav}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === "__menu") {
                setMenuOpen((v) => !v);
              } else {
                setMenuOpen(false);
                onNavigate(item.id);
              }
            }}
            className={s.navBtn}
            style={{ gap: item.id === "add-topics" ? 0 : 3 }}
          >
            {item.icon(isActive(item.id))}
            {item.id !== "add-topics" && (
              <span style={{ fontSize: 10, color: isActive(item.id) ? "#2563eb" : "#9ca3af", fontWeight: isActive(item.id) ? 600 : 400 }}>
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>
    </>
  );
}
