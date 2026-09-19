import { useCallback, useEffect, useMemo, useState } from "react"
import { ApiClient } from "./api/client"
import { getErrorMessage } from "./api/errors"
import { listBriefs, type BriefSummary } from "./api/briefs"
import { createTopics, listTopics } from "./api/topics"
import { getCurrentUser, type WorkspaceSummaryDto } from "./api/workspaces"
import { useAuth } from "./auth/AuthProvider"
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
import type { DiscoveryRun } from "./api/discovery"
import type { Topic } from "./types/domain"
type View = "overview" | "topics" | "briefs" | "add-topics" | "discovery" | `topic-${string}`

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
  const { session, isLoading: isAuthLoading, signOut, getAccessToken } = useAuth()
  const [view, setView] = useState<View>("overview")
  const [workspaces, setWorkspaces] = useState<WorkspaceSummaryDto[]>([])
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [briefs, setBriefs] = useState<BriefSummary[]>([])
  const [latestDiscoveryRun, setLatestDiscoveryRun] = useState<DiscoveryRun | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const isMobile = useIsMobile()
  const apiClient = useMemo(() => new ApiClient({ getAccessToken }), [getAccessToken])

  useEffect(() => {
    if (session === null) {
      setWorkspaces([])
      setWorkspaceId(null)
      setTopics([])
      setBriefs([])
      setLatestDiscoveryRun(null)
      return
    }

    let isActive = true
    setIsDataLoading(true)
    setDataError(null)

    getCurrentUser(apiClient)
      .then((currentUser) => {
        if (!isActive) {
          return
        }

        const firstWorkspace = currentUser.workspaces[0]
        setWorkspaces(currentUser.workspaces)
        setWorkspaceId(firstWorkspace?.id ?? null)
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }

        setDataError(getErrorMessage(error))
      })
      .finally(() => {
        if (isActive) {
          setIsDataLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [apiClient, session])

  useEffect(() => {
    if (workspaceId === null) {
      setTopics([])
      setBriefs([])
      setLatestDiscoveryRun(null)
      return
    }

    setLatestDiscoveryRun((currentRun) =>
      currentRun?.workspaceId === workspaceId ? currentRun : null,
    )

    let isActive = true
    setIsDataLoading(true)
    setDataError(null)

    Promise.all([listTopics(apiClient, workspaceId), listBriefs(apiClient, workspaceId)])
      .then(([nextTopics, nextBriefs]) => {
        if (isActive) {
          setTopics(nextTopics)
          setBriefs(nextBriefs)
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setDataError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (isActive) {
          setIsDataLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [apiClient, workspaceId])

  const hasProcessingTopics = topics.some((topic) => topic.status === "processing")

  useEffect(() => {
    if (workspaceId === null || !hasProcessingTopics) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      listTopics(apiClient, workspaceId)
        .then(setTopics)
        .catch((error: unknown) => setDataError(getErrorMessage(error)))
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [apiClient, hasProcessingTopics, workspaceId])

  const mergeTopic = useCallback((topic: Topic) => {
    setTopics((currentTopics) => {
      if (currentTopics.some((currentTopic) => currentTopic.id === topic.id)) {
        return currentTopics.map((currentTopic) =>
          currentTopic.id === topic.id ? topic : currentTopic,
        )
      }

      return [topic, ...currentTopics]
    })
  }, [])

  if (isAuthLoading) {
    return <div className={s.app}>Đang tải phiên đăng nhập...</div>
  }

  if (session === null) {
    return <Login />
  }

  const navigate = (v: string) => {
    setView(v as View)
  }

  const handleLogout = async () => {
    await signOut()
    setView("overview")
  }

  const handleAddTopics = async (titles: string[]) => {
    if (workspaceId === null) {
      setDataError("Workspace chưa sẵn sàng.")
      return
    }

    try {
      setDataError(null)
      const createdTopics = await createTopics(apiClient, workspaceId, titles)
      setTopics((currentTopics) => [...createdTopics, ...currentTopics])
      navigate("topics")
    } catch (error: unknown) {
      setDataError(getErrorMessage(error))
    }
  }

  const handleAddFromDiscovery = (topic: Topic) => {
    mergeTopic(topic)
  }

  const renderContent = () => {
    if (workspaceId === null && workspaces.length === 0) {
      if (isDataLoading) {
        return <div className={s.content}>Đang tải workspace...</div>
      }

      if (dataError !== null) {
        return <div className={s.content}>{dataError}</div>
      }

      return <div className={s.content}>Tài khoản này chưa có workspace.</div>
    }

    if (view === "overview") {
      return <Overview onNavigate={navigate} topics={topics} briefs={briefs} />
    }

    if (view === "topics") {
      return (
        <TopicsQueue
          apiClient={apiClient}
          workspaceId={workspaceId ?? ""}
          onNavigate={navigate}
          topics={topics}
          isLoading={isDataLoading}
          error={dataError}
          onTopicChange={mergeTopic}
        />
      )
    }

    if (view === "add-topics") {
      return (
        <AddTopics
          onBack={() => navigate("topics")}
          onAdd={(titles) => {
            void handleAddTopics(titles)
          }}
        />
      )
    }

    if (view === "briefs") {
      if (workspaceId === null) {
        return <div className={s.content}>Workspace chưa sẵn sàng.</div>
      }

      return (
        <ContentBriefs
          apiClient={apiClient}
          workspaceId={workspaceId}
          onNavigate={navigate}
          onBriefsChange={setBriefs}
        />
      )
    }

    if (view === "discovery") {
      if (workspaceId === null) {
        return <div className={s.content}>Workspace chưa sẵn sàng.</div>
      }

      return (
        <TopicDiscovery
          apiClient={apiClient}
          workspaceId={workspaceId}
          onNavigate={navigate}
          onAddToQueue={handleAddFromDiscovery}
          initialRun={latestDiscoveryRun}
          onRunChange={setLatestDiscoveryRun}
        />
      )
    }

    if (view.startsWith("topic-")) {
      return (
        <TopicDetail
          apiClient={apiClient}
          workspaceId={workspaceId ?? ""}
          topicId={view.replace("topic-", "")}
          topics={topics}
          onNavigate={navigate}
          onTopicChange={mergeTopic}
        />
      )
    }

    return null
  }

  return (
    <div className={s.app}>
      {!isMobile && (
        <Sidebar
          activeView={view}
          onNavigate={navigate}
          onLogout={() => {
            void handleLogout()
          }}
        />
      )}

      <div className={s.mainArea}>
        {!isMobile && (
          <TopBar
            onLogout={() => {
              void handleLogout()
            }}
          />
        )}
        <main className={s.content}>{renderContent()}</main>
      </div>

      {isMobile && (
        <BottomNav
          activeView={view}
          onNavigate={navigate}
          onLogout={() => {
            void handleLogout()
          }}
        />
      )}
    </div>
  )
}
