import s from "./BottomNav.module.css"

interface BottomNavProps {
  activeView: string
  onNavigate: (view: string) => void
  onLogout: () => void
}

const navItems = [
  {
    id: "overview",
    label: "Tổng quan",
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="2"
          y="2"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="11"
          y="2"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="2"
          y="11"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="11"
          y="11"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },

  {
    id: "topics",
    label: "Chủ đề",
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <line
          x1="6"
          y1="5"
          x2="17"
          y2="5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="6"
          y1="10"
          x2="17"
          y2="10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="6"
          y1="15"
          x2="17"
          y2="15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <circle cx="3" cy="5" r="1.2" fill="currentColor" />
        <circle cx="3" cy="10" r="1.2" fill="currentColor" />
        <circle cx="3" cy="15" r="1.2" fill="currentColor" />
      </svg>
    ),
  },

  {
    id: "add-topics",
    label: "",
    icon: () => (
      <div className={s.addButton}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <line
            x1="10"
            y1="3"
            x2="10"
            y2="17"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="3"
            y1="10"
            x2="17"
            y2="10"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
  },

  {
    id: "briefs",
    label: "Nội dung",
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="4"
          y="2.5"
          width="12"
          height="15"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        <line
          x1="7"
          y1="7"
          x2="13"
          y2="7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <line
          x1="7"
          y1="10.5"
          x2="13"
          y2="10.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <line
          x1="7"
          y1="14"
          x2="11"
          y2="14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },

  {
    id: "discovery",
    label: "Gợi ý",
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2.5a5.2 5.2 0 0 0-3.2 9.3c.7.55 1.2 1.2 1.35 2h3.7c.15-.8.65-1.45 1.35-2A5.2 5.2 0 0 0 10 2.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M8.2 16h3.6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <path
          d="M8.8 18h2.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export default function BottomNav({ activeView, onNavigate }: BottomNavProps) {
  const isTopicDetail = activeView.startsWith("topic-")

  const isActive = (id: string) => {
    /*
     * TopicDetail vẫn thuộc khu vực "Chủ đề".
     */
    if (id === "topics") {
      return activeView === "topics" || isTopicDetail
    }

    return activeView === id
  }

  return (
    <nav className={s.nav}>
      {navItems.map((item) => {
        const active = isActive(item.id)
        const isAdd = item.id === "add-topics"

        return (
          <button
            key={item.id}
            type="button"
            aria-label={isAdd ? "Thêm chủ đề" : item.label}
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate(item.id)}
            className={`${s.navBtn} ${isAdd ? s.addNavBtn : ""}`}
          >
            {item.icon()}

            {!isAdd && (
              <span
                className={`${s.navLabel} ${active ? s.navLabelActive : ""}`}
              >
                {item.label}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
