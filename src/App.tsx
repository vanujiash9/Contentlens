import { useState } from "react"
import Login from "./components/login/Login"
import s from "./App.module.css"
import Sidebar from "./components/layout/Sidebar"
import BottomNav from "./components/layout/BottomNav"
import Overview from "./components/overview/Overview"
import TopicsQueue from "./components/topics/TopicsQueue"
import TopicDetail from "./components/topics/TopicDetail"
import AddTopics from "./components/topics/AddTopics"
import ContentBriefs from "./components/briefs/ContentBriefs"
import TopicDiscovery from "./components/discovery/TopicDiscovery"
import { useIsMobile } from "./hooks/useIsMobile"
import { type Topic, type DiscoveredTopic } from "./data/mockData"

type View = "overview" | "topics" | "briefs" | "add-topics" | "discovery" | `topic-${string}`

function discoveredToTopic(d: DiscoveredTopic): Topic {
  return {
    id: `d-${d.id}`,
    title: d.title,
    status: "pending",
    source: "ai",
    opportunityScore: d.opportunityScore,
    priority: d.priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function TopBar({ onLogout }: { onLogout: () => void }) {
  return (
    <div className={s.topBar}>
      <button className={s.iconButton} aria-label="Thông báo" type="button">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 2A5 5 0 004 7v4l-1.5 2h13L14 11V7A5 5 0 009 2z"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 13.5a1.5 1.5 0 003 0"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <button
        className={s.accountButton}
        onClick={onLogout}
        type="button"
        aria-label="Mở tài khoản / đăng xuất"
      >
        <span className={s.avatar}>N</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4.5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [view, setView] = useState<View>("overview")
  const [discoveryQueue, setDiscoveryQueue] = useState<Topic[]>([])

  const isMobile = useIsMobile()

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  const navigate = (v: string) => {
    setView(v as View)
  }

  const handleAddFromDiscovery = (discovered: DiscoveredTopic) => {
    const topic = discoveredToTopic(discovered)

    setDiscoveryQueue((prev) =>
      prev.some((t) => t.id === topic.id) ? prev : [...prev, topic],
    )
  }

  const renderContent = () => {
    if (view === "overview") {
      return <Overview onNavigate={navigate} />
    }

    if (view === "topics") {
      return <TopicsQueue onNavigate={navigate} extraTopics={discoveryQueue} />
    }

    if (view === "add-topics") {
      return (
        <AddTopics
          onBack={() => navigate("topics")}
          onAdd={() => navigate("topics")}
        />
      )
    }

    if (view === "briefs") {
      return <ContentBriefs onNavigate={navigate} />
    }

    if (view === "discovery") {
      return (
        <TopicDiscovery
          onNavigate={navigate}
          onAddToQueue={handleAddFromDiscovery}
        />
      )
    }

    if (view.startsWith("topic-")) {
      return (
        <TopicDetail
          topicId={view.replace("topic-", "")}
          onNavigate={navigate}
        />
      )
    }

    return null
  }

  return (
    <div className={s.app}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          activeView={view}
          onNavigate={navigate}
          onLogout={() => setLoggedIn(false)}
        />
      )}

      {/* Main app */}
      <div className={s.mainArea}>
        {/* Desktop topbar only */}
        {!isMobile && <TopBar onLogout={() => setLoggedIn(false)} />}

        {/* Page content */}
        <main className={s.content}>{renderContent()}</main>
      </div>

      {/* Mobile navigation */}
      {isMobile && (
        <BottomNav
          activeView={view}
          onNavigate={navigate}
          onLogout={() => setLoggedIn(false)}
        />
      )}
    </div>
  )
}
