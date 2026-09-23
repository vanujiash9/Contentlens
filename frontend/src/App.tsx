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

type ActivityType = "research_done" | "topic_added" | "brief_created" | "research_failed" | "research_started"

interface RecentActivity {
  id: string
  type: ActivityType
  topicTitle: string
  updatedAt: string
}

const ACTIVITY_LABELS: Record<ActivityType, { label: string; className: string }> = {
  research_done: { label: "Hoàn thành nghiên cứu", className: s.activitySuccess },
  topic_added: { label: "Tạo chủ đề mới", className: s.activityNeutral },
  brief_created: { label: "Tạo Content Brief", className: s.activityNeutral },
  research_failed: { label: "Nghiên cứu thất bại", className: s.activityDanger },
  research_started: { label: "Đang chạy nghiên cứu", className: s.activityWarning },
}
const NOTIFICATION_SEEN_KEY = "contentlens:last-seen-activity-at"

function buildRecentActivity(topics: Topic[], briefs: BriefSummary[]): RecentActivity[] {
  return [...topics.map(activityFromTopic), ...briefs.map(activityFromBrief)]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5)
}

function activityFromTopic(topic: Topic): RecentActivity {
  const typeByStatus: Record<Topic["status"], ActivityType> = {
    pending: "topic_added",
    processing: "research_started",
    completed: "research_done",
    failed: "research_failed",
  }

  return {
    id: `topic-${topic.id}`,
    type: typeByStatus[topic.status],
    topicTitle: topic.title,
    updatedAt: topic.updatedAt,
  }
}

function activityFromBrief(brief: BriefSummary): RecentActivity {
  return {
    id: `brief-${brief.id}`,
    type: "brief_created",
    topicTitle: brief.title,
    updatedAt: brief.updatedAt,
  }
}

function formatActivityTime(iso: string): string {
  const date = new Date(iso)
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function TopBar({
  activities,
  onNavigate,
  onLogout,
}: {
  activities: RecentActivity[]
  onNavigate: (view: string) => void
  onLogout: () => void
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [lastSeenActivityAt, setLastSeenActivityAt] = useState(() =>
    window.localStorage.getItem(NOTIFICATION_SEEN_KEY) ?? "",
  )
  const latestActivityAt = activities[0]?.updatedAt ?? ""
  const unreadCount = activities.filter((activity) => {
    if (!lastSeenActivityAt) {
      return true
    }
    return +new Date(activity.updatedAt) > +new Date(lastSeenActivityAt)
  }).length

  const markNotificationsSeen = () => {
    if (!latestActivityAt) {
      return
    }
    window.localStorage.setItem(NOTIFICATION_SEEN_KEY, latestActivityAt)
    setLastSeenActivityAt(latestActivityAt)
  }

  const handleToggleNotifications = () => {
    setIsNotificationsOpen((value) => !value)
    markNotificationsSeen()
  }

  const handleActivityNavigate = () => {
    setIsNotificationsOpen(false)
    markNotificationsSeen()
    onNavigate("topics")
  }

  return (
    <div className={s.topBar}>
      <div className={s.notificationWrap}>
        <button
          className={s.iconButton}
          aria-label="Thông báo"
          type="button"
          onClick={handleToggleNotifications}
        >
          {unreadCount > 0 ? <span className={s.notificationBadge}>{unreadCount}</span> : null}
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

        {isNotificationsOpen ? (
          <div className={s.notificationPanel}>
            <div className={s.notificationHeader}>Hoạt động gần đây</div>
            {activities.length === 0 ? (
              <div className={s.notificationEmpty}>Chưa có hoạt động nào.</div>
            ) : (
              <div className={s.notificationList}>
                {activities.map((activity) => {
                  const cfg = ACTIVITY_LABELS[activity.type]
                  return (
                    <div className={s.notificationItem} key={activity.id}>
                      <span className={`${s.activityDot} ${cfg.className}`} />
                      <div className={s.notificationText}>
                        <strong>{cfg.label}</strong>
                        <span>{activity.topicTitle}</span>
                      </div>
                      <time>{formatActivityTime(activity.updatedAt)}</time>
                    </div>
                  )
                })}
              </div>
            )}
            <button className={s.notificationFooter} type="button" onClick={handleActivityNavigate}>
              Xem hàng đợi →
            </button>
          </div>
        ) : null}
      </div>

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
    setIsDataLoading(topics.length === 0 && briefs.length === 0)
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

  const removeTopic = useCallback((topicId: string) => {
    setTopics((currentTopics) => currentTopics.filter((topic) => topic.id !== topicId))
  }, [])

  const replaceBriefs = useCallback((nextBriefs: BriefSummary[]) => {
    setBriefs(nextBriefs)
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

  const recentActivity = buildRecentActivity(topics, briefs)

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
          onTopicDelete={removeTopic}
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
          initialBriefs={briefs}
          onNavigate={navigate}
          onBriefsChange={replaceBriefs}
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
            activities={recentActivity}
            onNavigate={navigate}
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
