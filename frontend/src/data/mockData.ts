export interface ActivityEvent {
  id: string
  time: string
  type:
    | "research_done"
    | "topic_added"
    | "brief_created"
    | "research_failed"
    | "research_started"
    | "ai_discovery"
  topicTitle: string
  topicId?: string
}

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: "a1", time: "10:32", type: "research_done", topicTitle: "Yamaha U3 vs Kawai K300", topicId: "t001" },
  { id: "a2", time: "10:15", type: "topic_added", topicTitle: "Best piano cho người mới bắt đầu" },
  { id: "a3", time: "09:48", type: "brief_created", topicTitle: "Kawai K300 review chi tiết", topicId: "t003" },
  { id: "a4", time: "09:20", type: "research_failed", topicTitle: "Roland FP-90X vs Kawai ES920" },
  { id: "a5", time: "08:55", type: "ai_discovery", topicTitle: "AI đề xuất 10 chủ đề mới" },
]
