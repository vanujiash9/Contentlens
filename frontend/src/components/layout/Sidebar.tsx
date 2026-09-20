import { useState } from "react";
import s from "./Sidebar.module.css";

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

type IconProps = {
  size?: number;
};

/* =========================================================
   ICONS
   ========================================================= */

function OverviewIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="5.5" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10.5" y="2" width="5.5" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="10.5" width="5.5" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function QueueIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="3.2" cy="4.5" r="1" fill="currentColor" />
      <circle cx="3.2" cy="9" r="1" fill="currentColor" />
      <circle cx="3.2" cy="13.5" r="1" fill="currentColor" />

      <path d="M6 4.5H15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 9H15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 13.5H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function DiscoveryIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path
        d="M9 2.4A5.2 5.2 0 0 0 5.8 11.7c.7.55 1.15 1.25 1.3 2.05h3.8c.15-.8.6-1.5 1.3-2.05A5.2 5.2 0 0 0 9 2.4Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.2 15.4H10.8" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function BriefIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path
        d="M4 2.5H11.5L14.5 5.5V15C14.5 15.55 14.05 16 13.5 16H4.5C3.95 16 3.5 15.55 3.5 15V3.5C3.5 2.95 3.95 2.5 4.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M11.5 2.8V5.5H14.2" stroke="currentColor" strokeWidth="1.35" />
      <path d="M6.5 8H11.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M6.5 11H11.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M6.5 14H9.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.35" />
      <path
        d="M9 2V3.5M9 14.5V16M2 9H3.5M14.5 9H16"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M4.05 4.05L5.1 5.1M12.9 12.9L13.95 13.95M4.05 13.95L5.1 12.9M12.9 5.1L13.95 4.05"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path
        d="M7 3H4.5C3.95 3 3.5 3.45 3.5 4V14C3.5 14.55 3.95 15 4.5 15H7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M10 6L13 9L10 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* =========================================================
   NAV ITEM
   ========================================================= */

function NavItem({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: (props: IconProps) => React.ReactElement;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${s.navItem} ${active ? s.navItemActive : ""}`}
    >
      <span className={s.navIcon}>
        <Icon />
      </span>

      <span className={s.navLabel}>{label}</span>
    </button>
  );
}

/* =========================================================
   SIDEBAR
   ========================================================= */

export default function Sidebar({
  activeView,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const [accountOpen, setAccountOpen] = useState(false);

  const isTopicDetail = activeView.startsWith("topic-");

  const queueActive =
    activeView === "topics" ||
    isTopicDetail;

  const discoveryActive = activeView === "discovery";
  const briefActive = activeView === "briefs";

  return (
    <aside className={s.aside}>
      {/* Brand */}
      <div className={s.brand}>
        <div className={s.logo}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 2.5L15 5.8V12.2L9 15.5L3 12.2V5.8L9 2.5Z"
              stroke="white"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            <path
              d="M9 2.5V15.5M3 5.8L9 9L15 5.8"
              stroke="white"
              strokeWidth="1.15"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className={s.brandText}>
          <div className={s.brandName}>ContentLens</div>
          <div className={s.brandSubtitle}>Piano Research</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={s.navigation}>
        <section className={s.navSection}>
          <div className={s.sectionLabel}>TỔNG QUAN</div>

          <NavItem
            label="Tổng quan"
            icon={OverviewIcon}
            active={activeView === "overview"}
            onClick={() => onNavigate("overview")}
          />
        </section>

        <section className={s.navSection}>
          <div className={s.sectionLabel}>NGHIÊN CỨU</div>

          <NavItem
            label="Hàng đợi nghiên cứu"
            icon={QueueIcon}
            active={queueActive}
            onClick={() => onNavigate("topics")}
          />

          <NavItem
            label="Khám phá topic"
            icon={DiscoveryIcon}
            active={discoveryActive}
            onClick={() => onNavigate("discovery")}
          />
        </section>

        <section className={s.navSection}>
          <div className={s.sectionLabel}>NỘI DUNG</div>

          <NavItem
            label="Lịch sử Brief"
            icon={BriefIcon}
            active={briefActive}
            onClick={() => onNavigate("briefs")}
          />
        </section>
      </nav>

      {/* Account */}
      <div className={s.footer}>
        {accountOpen && (
          <div className={s.accountMenu}>
            <button
              type="button"
              className={s.accountMenuItem}
              onClick={() => {
                setAccountOpen(false);
                onNavigate("overview");
              }}
            >
              <SettingsIcon />
              <span>Cài đặt</span>
            </button>

            <div className={s.accountDivider} />

            <button
              type="button"
              className={`${s.accountMenuItem} ${s.logoutItem}`}
              onClick={() => {
                setAccountOpen(false);
                onLogout();
              }}
            >
              <LogoutIcon />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className={`${s.account} ${accountOpen ? s.accountOpen : ""}`}
          onClick={() => setAccountOpen((prev) => !prev)}
          aria-expanded={accountOpen}
        >
          <div className={s.avatar}>N</div>

          <div className={s.accountInfo}>
            <div className={s.accountName}>Nguyễn</div>
            <div className={s.accountSubtitle}>Piano Studio</div>
          </div>

          <svg
            className={`${s.chevron} ${
              accountOpen ? s.chevronOpen : ""
            }`}
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M4 5.5L7 8.5L10 5.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
}