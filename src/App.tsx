import { useState } from "react";
import Login from "./components/login/Login";
import Sidebar from "./components/layout/Sidebar";
import BottomNav from "./components/layout/BottomNav";
import Overview from "./components/overview/Overview";
import TopicsQueue from "./components/topics/TopicsQueue";
import TopicDetail from "./components/topics/TopicDetail";
import AddTopics from "./components/topics/AddTopics";
import ContentBriefs from "./components/briefs/ContentBriefs";
import TopicDiscovery from "./components/discovery/TopicDiscovery";
import { useIsMobile } from "./hooks/useIsMobile";
import { type Topic, type DiscoveredTopic } from "./data/mockData";

type View =
  | "overview"
  | "topics"
  | "briefs"
  | "add-topics"
  | "discovery"
  | `topic-${string}`;

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
  };
}

function TopBar({ onLogout }: { onLogout: () => void }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{
        height: 50,
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 28px",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Notification */}
      <button
        aria-label="Thông báo"
        style={{
          background: "transparent",
          borderWidth: 0,
          cursor: "pointer",
          padding: 6,
          borderRadius: 6,
          color: "#9ca3af",
          display: "flex",
          alignItems: "center",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            d="M9 2A5 5 0 004 7v4l-1.5 2h13L14 11V7A5 5 0 009 2z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 13.5a1.5 1.5 0 003 0"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* User / logout */}
      <button
        onClick={onLogout}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: hov ? "#f3f4f6" : "transparent",
          borderWidth: 0,
          cursor: "pointer",
          padding: "4px 8px 4px 4px",
          borderRadius: 8,
          transition: "background 0.12s",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 99,
            background: "#1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            N
          </span>
        </div>

        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
        >
          <path
            d="M2 3.5l3 3 3-3"
            stroke="#9ca3af"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [discoveryQueue, setDiscoveryQueue] = useState<Topic[]>([]);

  const isMobile = useIsMobile();

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const navigate = (v: string) => {
    setView(v as View);
  };

  const handleAddFromDiscovery = (discovered: DiscoveredTopic) => {
    const topic = discoveredToTopic(discovered);

    setDiscoveryQueue((prev) =>
      prev.some((t) => t.id === topic.id)
        ? prev
        : [...prev, topic]
    );
  };

  const renderContent = () => {
    if (view === "overview") {
      return <Overview onNavigate={navigate} />;
    }

    if (view === "topics") {
      return (
        <TopicsQueue
          onNavigate={navigate}
          extraTopics={discoveryQueue}
        />
      );
    }

    if (view === "add-topics") {
      return (
        <AddTopics
          onBack={() => navigate("topics")}
          onAdd={() => navigate("topics")}
        />
      );
    }

    if (view === "briefs") {
      return <ContentBriefs onNavigate={navigate} />;
    }

    if (view === "discovery") {
      return (
        <TopicDiscovery
          onNavigate={navigate}
          onAddToQueue={handleAddFromDiscovery}
        />
      );
    }

    if (view.startsWith("topic-")) {
      return (
        <TopicDetail
          topicId={view.replace("topic-", "")}
          onNavigate={navigate}
        />
      );
    }

    return null;
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        background: "#f5f6f8",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          activeView={view}
          onNavigate={navigate}
          onLogout={() => setLoggedIn(false)}
        />
      )}

      {/* Main app */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Desktop topbar only */}
        {!isMobile && (
          <TopBar onLogout={() => setLoggedIn(false)} />
        )}

        {/* Page content */}
        <main
          style={{
            flex: 1,
            overflow: "auto",

            // Chừa chỗ cho fixed BottomNav trên mobile
            paddingBottom: isMobile ? 76 : 0,
          }}
        >
          {renderContent()}
        </main>
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
  );
}