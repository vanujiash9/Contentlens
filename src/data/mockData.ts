export type TopicStatus = "pending" | "processing" | "completed" | "failed";
export type Priority = "high" | "medium" | "low";
export type TopicSource = "user" | "ai";

export interface Source {
  id: string;
  url: string;
  title: string;
  domain: string;
  type: "official" | "review" | "article" | "forum" | "product" | "comparison";
  relevance: number;
  publishedDate?: string;
  extractedInfo: string;
}

export interface SearchQuery {
  id: string;
  query: string;
  resultsCount: number;
  status: "completed" | "pending";
}

export interface Finding {
  id: string;
  claim: string;
  confidence: "high" | "medium" | "low";
  sources: string[];
}

export interface InformationGap {
  id: string;
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
  evidence: string;
}

export interface Opportunity {
  score: number;
  priority: Priority;
  recommendation: string;
  angle: string;
  audience: string;
  reasons: string[];
  breakdown: { label: string; score: number }[];
}

export interface QualityCheck {
  label: string;
  ok: boolean;
}

export interface ContentQuality {
  wordCount: number;
  sourcesUsed: number;
  totalClaims: number;
  citedClaims: number;
  checks: QualityCheck[];
  warnings: string[];
}

export interface ContentBrief {
  title: string;
  searchIntent: string;
  targetAudience: string;
  objective: string;
  angle: string;
  keyQuestions: string[];
  outline: { section: string; description: string }[];
  keyFacts: string[];
  draft: string;
  mustCover?: string[];
  mustAvoid?: string[];
  evidenceMap?: { section: string; claimIds: string[] }[];
  contentQuality?: ContentQuality;
  approvedAt?: string;
}

export interface ResearchPlan {
  objective: string;
  questions: string[];
  approach: string;
}

export interface Topic {
  id: string;
  title: string;
  status: TopicStatus;
  source?: TopicSource;
  opportunityScore?: number;
  priority?: Priority;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  researchPlan?: ResearchPlan;
  queries?: SearchQuery[];
  sources?: Source[];
  findings?: Finding[];
  gaps?: InformationGap[];
  opportunity?: Opportunity;
  brief?: ContentBrief;
  researchProgress?: number;
  currentStep?: string;
}

// ── AI Discovered Topics ───────────────────────────────────────────────────

export interface SignalDetail {
  score: number;           // 0–100
  level: "high" | "medium" | "low";
  source: string;          // e.g. "Google Trends", "10 nguồn phân tích"
  evidence: string;        // short description of why
}

export interface DiscoveredTopic {
  id: string;
  title: string;
  opportunityScore: number;
  priority: Priority;
  searchSignals: SignalDetail;
  contentGap: SignalDetail;
  businessRelevance: SignalDetail;
  angle: string;
  reasoning: string;
}

export const MOCK_DISCOVERED: DiscoveredTopic[] = [
  {
    id: "d001",
    title: "Piano cơ hay piano điện?",
    opportunityScore: 92,
    priority: "high",
    searchSignals: { score: 88, level: "high", source: "Google Trends (VN)", evidence: "Tăng 34% trong 30 ngày, đỉnh tháng 8" },
    contentGap:    { score: 91, level: "high", source: "14 nguồn được phân tích", evidence: "Không có bài so sánh theo nhu cầu người mua VN" },
    businessRelevance: { score: 95, level: "high", source: "Piano purchase intent", evidence: "Từ khóa xuất hiện cùng 'mua', 'giá', 'nên chọn'" },
    angle: "So sánh theo nhu cầu của từng nhóm người mua, không chỉ theo thông số kỹ thuật.",
    reasoning: "Từ khóa này có lượng tìm kiếm cao nhưng nội dung hiện tại chưa giải quyết được nhu cầu thực tế của người mua lần đầu.",
  },
  {
    id: "d002",
    title: "Piano cho người mới hoàn toàn không biết gì",
    opportunityScore: 86,
    priority: "high",
    searchSignals: { score: 82, level: "high", source: "Google Trends (VN)", evidence: "Ổn định top 5 từ khóa nhạc cụ 90 ngày qua" },
    contentGap:    { score: 89, level: "high", source: "11 nguồn được phân tích", evidence: "Toàn bộ nội dung hiện có viết cho người đã có nền tảng" },
    businessRelevance: { score: 87, level: "high", source: "Beginner buyer intent", evidence: "Đi cùng 'học', 'bắt đầu', 'chưa biết gì'" },
    angle: "Hướng dẫn từ A-Z dành cho người chưa bao giờ học nhạc, tập trung vào quyết định mua đàn đầu tiên.",
    reasoning: "Phần lớn nội dung hiện tại viết cho người đã có kiến thức âm nhạc. Người mới hoàn toàn thiếu nguồn thông tin phù hợp.",
  },
  {
    id: "d003",
    title: "Yamaha U1 vs Yamaha U3",
    opportunityScore: 84,
    priority: "high",
    searchSignals: { score: 71, level: "medium", source: "Google Trends (VN)", evidence: "Tìm kiếm đồng thời 2 model tăng 18% so với tháng trước" },
    contentGap:    { score: 93, level: "high", source: "8 nguồn được phân tích", evidence: "Chưa có bài so sánh chuyên sâu tiếng Việt" },
    businessRelevance: { score: 88, level: "high", source: "Upright piano intent", evidence: "Cùng cụm với 'mua upright', 'giá U1', 'U3 cũ'" },
    angle: "So sánh chi phí thực tế dài hạn, không chỉ giá mua ban đầu.",
    reasoning: "Cả hai model đều được tìm kiếm nhiều cùng nhau. Chưa có bài so sánh chuyên sâu bằng tiếng Việt.",
  },
  {
    id: "d004",
    title: "Học piano online có hiệu quả không?",
    opportunityScore: 79,
    priority: "medium",
    searchSignals: { score: 84, level: "high", source: "Google Trends (VN)", evidence: "Tăng đều từ 2022, đỉnh Q1 hằng năm" },
    contentGap:    { score: 67, level: "medium", source: "16 nguồn được phân tích", evidence: "Có nội dung nhưng thiếu góc nhìn thực tế người Việt" },
    businessRelevance: { score: 72, level: "medium", source: "Learning intent", evidence: "Thường đi cùng 'app học piano', 'khóa học online'" },
    angle: "Review thực tế từ học sinh và giáo viên, kèm gợi ý platform phù hợp với người Việt.",
    reasoning: "Xu hướng học online tăng mạnh sau 2020. Cơ hội kết nối với audience muốn học tại nhà.",
  },
  {
    id: "d005",
    title: "Bảo trì đàn piano upright tại nhà",
    opportunityScore: 75,
    priority: "medium",
    searchSignals: { score: 62, level: "medium", source: "Google Trends (VN)", evidence: "Ổn định, peak tháng 10–11 (mùa khô hanh)" },
    contentGap:    { score: 88, level: "high", source: "6 nguồn được phân tích", evidence: "Gần như không có bài hướng dẫn tiếng Việt đầy đủ" },
    businessRelevance: { score: 71, level: "medium", source: "Ownership maintenance", evidence: "Người có đàn — cơ hội bán phụ kiện, dịch vụ" },
    angle: "Checklist bảo trì theo mùa, chi phí thực tế và khi nào cần gọi thợ chuyên nghiệp.",
    reasoning: "Người dùng có đàn thường không biết cách bảo trì đúng cách. Content gap rõ ràng.",
  },
  {
    id: "d006",
    title: "Kawai ES920 review",
    opportunityScore: 73,
    priority: "medium",
    searchSignals: { score: 65, level: "medium", source: "Google Trends (VN)", evidence: "Tăng sau khi ra mắt, ổn định 3 tháng gần đây" },
    contentGap:    { score: 70, level: "medium", source: "9 nguồn được phân tích", evidence: "Review EN nhiều, nhưng tiếng Việt còn ít và ngắn" },
    businessRelevance: { score: 86, level: "high", source: "Digital piano purchase", evidence: "Model đang được nhiều học sinh trung cấp hỏi mua" },
    angle: "Review trải nghiệm thực tế của người dùng Việt Nam, so sánh với các model cùng phân khúc.",
    reasoning: "Model mới, ít review tiếng Việt, nhưng đã xuất hiện nhiều câu hỏi trên các diễn đàn piano VN.",
  },
  {
    id: "d007",
    title: "Nên mua đàn piano cũ hay mới?",
    opportunityScore: 70,
    priority: "medium",
    searchSignals: { score: 68, level: "medium", source: "Google Trends (VN)", evidence: "Ổn định quanh năm, không có xu hướng mạnh" },
    contentGap:    { score: 72, level: "medium", source: "12 nguồn được phân tích", evidence: "Có bài nhưng thiếu checklist thực tế cho người không chuyên" },
    businessRelevance: { score: 65, level: "medium", source: "Pre-purchase research", evidence: "Giai đoạn cân nhắc — cơ hội tư vấn hướng về đàn mới" },
    angle: "Hướng dẫn đánh giá rủi ro khi mua đàn cũ, checklist kiểm tra trực tiếp.",
    reasoning: "Câu hỏi phổ biến trong cộng đồng nhưng chưa có bài viết chuyên sâu, đủ tin cậy bằng tiếng Việt.",
  },
  {
    id: "d008",
    title: "Roland FP-30X review 2026",
    opportunityScore: 68,
    priority: "medium",
    searchSignals: { score: 79, level: "high", source: "Google Trends (VN)", evidence: "Tìm kiếm tên model tăng 22% sau bản update firmware" },
    contentGap:    { score: 44, level: "low", source: "19 nguồn được phân tích", evidence: "Nhiều review chất lượng đã có — cạnh tranh cao" },
    businessRelevance: { score: 68, level: "medium", source: "Entry digital piano", evidence: "Phổ biến nhưng không phải segment chính của cửa hàng" },
    angle: "Đánh giá cập nhật với so sánh trực tiếp Yamaha P-45 và Casio CDP-S110.",
    reasoning: "Cạnh tranh nội dung cao, nhưng có thể thắng bằng format so sánh cụ thể hơn.",
  },
  {
    id: "d009",
    title: "Học piano cho trẻ em mấy tuổi là phù hợp?",
    opportunityScore: 65,
    priority: "low",
    searchSignals: { score: 77, level: "high", source: "Google Trends (VN)", evidence: "Tăng mỗi tháng 9 (năm học mới), đỉnh rõ ràng" },
    contentGap:    { score: 41, level: "low", source: "21 nguồn được phân tích", evidence: "Rất nhiều bài đã có, hầu hết từ trung tâm âm nhạc" },
    businessRelevance: { score: 58, level: "medium", source: "Parent research intent", evidence: "Phụ huynh tìm hiểu — cơ hội tư vấn đàn dành cho trẻ" },
    angle: "Tư vấn dựa trên phát triển tâm lý trẻ, không chỉ dựa vào quan điểm giáo viên.",
    reasoning: "Nhiều bài viết đã có nhưng hầu hết chỉ nói chung chung. Góc tâm lý học trẻ em còn bỏ ngỏ.",
  },
  {
    id: "d010",
    title: "Đàn piano Steinway có đáng giá không?",
    opportunityScore: 62,
    priority: "low",
    searchSignals: { score: 31, level: "low", source: "Google Trends (VN)", evidence: "Lượng tìm kiếm thấp, dưới ngưỡng đo được chính xác" },
    contentGap:    { score: 85, level: "high", source: "4 nguồn được phân tích", evidence: "Hầu như không có nội dung phân tích giá trị tiếng Việt" },
    businessRelevance: { score: 38, level: "low", source: "Luxury segment", evidence: "Segment rất nhỏ, ít liên quan đến portfolio hiện tại" },
    angle: "Phân tích giá trị thực tế so với giá bán, dành cho người đang cân nhắc đầu tư.",
    reasoning: "Tìm kiếm ít nhưng content gap lớn. Có thể thu hút audience cao cấp.",
  },
];

// ── Domain registry ────────────────────────────────────────────────────────

export type DomainTrust = "trusted" | "blocked" | "neutral";

export interface DomainEntry {
  domain: string;
  visitCount: number;       // tổng lần AI truy cập
  avgRelevance: number;     // trung bình relevance score
  sourceTypes: string[];    // các loại nguồn từ domain này
  language: "vi" | "en" | "both";
  category: "review" | "forum" | "news" | "official" | "comparison" | "academic";
  trust: DomainTrust;
  lastVisited: string;      // relative time label
  recentSources: {
    id: string;
    title: string;
    url: string;
    relevance: number;
    topicTitle: string;
    date: string;
  }[];
}

export const MOCK_DOMAINS: DomainEntry[] = [
  {
    domain: "pianobuyer.com",
    visitCount: 18,
    avgRelevance: 91,
    sourceTypes: ["review", "comparison"],
    language: "en",
    category: "review",
    trust: "trusted",
    lastVisited: "2 giờ trước",
    recentSources: [
      { id: "rs1", title: "Kawai K300 — Professional Review", url: "https://pianobuyer.com/reviews/kawai-k300", relevance: 95, topicTitle: "Yamaha U3 vs Kawai K300", date: "25/08" },
      { id: "rs2", title: "Best Upright Pianos Under $5000", url: "https://pianobuyer.com/guides/upright-under-5000", relevance: 88, topicTitle: "Best piano cho người mới", date: "26/08" },
      { id: "rs3", title: "Yamaha vs Kawai: Brand Comparison", url: "https://pianobuyer.com/comparison/yamaha-vs-kawai", relevance: 90, topicTitle: "Yamaha U3 vs Kawai K300", date: "25/08" },
    ],
  },
  {
    domain: "pianodreamers.com",
    visitCount: 14,
    avgRelevance: 87,
    sourceTypes: ["article", "review"],
    language: "en",
    category: "review",
    trust: "trusted",
    lastVisited: "3 giờ trước",
    recentSources: [
      { id: "rs4", title: "Yamaha U3 Upright Piano — In-Depth Analysis", url: "https://pianodreamers.com/yamaha-u3", relevance: 92, topicTitle: "Yamaha U3 vs Kawai K300", date: "25/08" },
      { id: "rs5", title: "Digital vs Acoustic: Which is Right For You?", url: "https://pianodreamers.com/digital-vs-acoustic", relevance: 84, topicTitle: "Best piano cho người mới", date: "26/08" },
    ],
  },
  {
    domain: "musicradar.com",
    visitCount: 12,
    avgRelevance: 83,
    sourceTypes: ["review", "article"],
    language: "en",
    category: "review",
    trust: "trusted",
    lastVisited: "4 giờ trước",
    recentSources: [
      { id: "rs6", title: "Best Pianos for Beginners 2026", url: "https://musicradar.com/best-pianos-beginners", relevance: 88, topicTitle: "Best piano cho người mới", date: "26/08" },
      { id: "rs7", title: "Roland FP-30X Review", url: "https://musicradar.com/roland-fp30x-review", relevance: 79, topicTitle: "Best piano cho người mới", date: "27/08" },
    ],
  },
  {
    domain: "reddit.com",
    visitCount: 22,
    avgRelevance: 68,
    sourceTypes: ["forum"],
    language: "en",
    category: "forum",
    trust: "neutral",
    lastVisited: "2 giờ trước",
    recentSources: [
      { id: "rs8", title: "r/piano: Real users compare U3 vs K300", url: "https://reddit.com/r/piano/u3-k300", relevance: 78, topicTitle: "Yamaha U3 vs Kawai K300", date: "25/08" },
      { id: "rs9", title: "r/piano: Best beginner digital piano 2026?", url: "https://reddit.com/r/piano/beginner-2026", relevance: 72, topicTitle: "Best piano cho người mới", date: "26/08" },
      { id: "rs10", title: "r/pianolearning: Starting piano at 30 — which piano?", url: "https://reddit.com/r/pianolearning/at-30", relevance: 61, topicTitle: "Best piano cho người mới", date: "27/08" },
    ],
  },
  {
    domain: "yamaha.com",
    visitCount: 8,
    avgRelevance: 75,
    sourceTypes: ["official", "product"],
    language: "both",
    category: "official",
    trust: "trusted",
    lastVisited: "1 ngày trước",
    recentSources: [
      { id: "rs11", title: "Yamaha U Series — Official Specs", url: "https://yamaha.com/u-series", relevance: 80, topicTitle: "Yamaha U3 vs Kawai K300", date: "25/08" },
      { id: "rs12", title: "Yamaha Clavinova CLP-745 Product Page", url: "https://yamaha.com/clavinova-clp745", relevance: 70, topicTitle: "Yamaha Clavinova CLP-745 review", date: "27/08" },
    ],
  },
  {
    domain: "kawai.com",
    visitCount: 7,
    avgRelevance: 72,
    sourceTypes: ["official", "product"],
    language: "both",
    category: "official",
    trust: "trusted",
    lastVisited: "1 ngày trước",
    recentSources: [
      { id: "rs13", title: "Kawai K300 — Official Product Page", url: "https://kawai.com/k300", relevance: 76, topicTitle: "Kawai K300 review chi tiết", date: "24/08" },
      { id: "rs14", title: "Kawai Millennium III Action — Technology Overview", url: "https://kawai.com/millennium-iii", relevance: 68, topicTitle: "Yamaha U3 vs Kawai K300", date: "25/08" },
    ],
  },
  {
    domain: "tinhte.vn",
    visitCount: 9,
    avgRelevance: 62,
    sourceTypes: ["forum", "article"],
    language: "vi",
    category: "forum",
    trust: "neutral",
    lastVisited: "5 giờ trước",
    recentSources: [
      { id: "rs15", title: "Hỏi đáp: Chọn đàn piano cho con học", url: "https://tinhte.vn/thread/chon-dan-piano", relevance: 65, topicTitle: "Best piano cho người mới", date: "26/08" },
      { id: "rs16", title: "Review Yamaha P-45 sau 1 năm dùng", url: "https://tinhte.vn/thread/yamaha-p45-review", relevance: 58, topicTitle: "Best piano cho người mới", date: "27/08" },
    ],
  },
  {
    domain: "vietpiano.vn",
    visitCount: 11,
    avgRelevance: 79,
    sourceTypes: ["product", "article"],
    language: "vi",
    category: "official",
    trust: "trusted",
    lastVisited: "3 giờ trước",
    recentSources: [
      { id: "rs17", title: "Bảng giá đàn piano Yamaha 2026", url: "https://vietpiano.vn/gia-yamaha-2026", relevance: 82, topicTitle: "Yamaha U3 vs Kawai K300", date: "25/08" },
      { id: "rs18", title: "Đàn piano nào phù hợp trẻ em học?", url: "https://vietpiano.vn/piano-tre-em", relevance: 76, topicTitle: "Best piano cho người mới", date: "26/08" },
    ],
  },
  {
    domain: "nhaccu.net",
    visitCount: 6,
    avgRelevance: 54,
    sourceTypes: ["forum"],
    language: "vi",
    category: "forum",
    trust: "neutral",
    lastVisited: "1 ngày trước",
    recentSources: [
      { id: "rs19", title: "Thread: Kinh nghiệm mua đàn piano cũ", url: "https://nhaccu.net/forum/mua-dan-cu", relevance: 54, topicTitle: "Best piano cho người mới", date: "27/08" },
    ],
  },
  {
    domain: "sweetwater.com",
    visitCount: 5,
    avgRelevance: 85,
    sourceTypes: ["review", "comparison"],
    language: "en",
    category: "review",
    trust: "trusted",
    lastVisited: "2 ngày trước",
    recentSources: [
      { id: "rs20", title: "Kawai ES920 vs Roland FP-90X Comparison", url: "https://sweetwater.com/insync/kawai-es920-vs-fp90x", relevance: 85, topicTitle: "Roland FP-90X vs Kawai ES920", date: "27/08" },
    ],
  },
];

// ── Activity ───────────────────────────────────────────────────────────────

export interface ActivityEvent {
  id: string;
  time: string;
  type: "research_done" | "topic_added" | "brief_created" | "research_failed" | "research_started" | "ai_discovery";
  topicTitle: string;
  topicId?: string;
}

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: "a1", time: "10:32", type: "research_done", topicTitle: "Yamaha U3 vs Kawai K300", topicId: "t001" },
  { id: "a2", time: "10:15", type: "topic_added", topicTitle: "Best piano cho người mới bắt đầu" },
  { id: "a3", time: "09:48", type: "brief_created", topicTitle: "Kawai K300 review chi tiết", topicId: "t003" },
  { id: "a4", time: "09:20", type: "research_failed", topicTitle: "Roland FP-90X vs Kawai ES920" },
  { id: "a5", time: "08:55", type: "ai_discovery", topicTitle: "AI đề xuất 10 chủ đề mới" },
  { id: "a6", time: "08:30", type: "research_done", topicTitle: "Kawai K300 review chi tiết", topicId: "t003" },
];

// ── Topics ─────────────────────────────────────────────────────────────────

export const MOCK_TOPICS: Topic[] = [
  {
    id: "t001",
    title: "Yamaha U3 vs Kawai K300",
    status: "completed",
    source: "user",
    opportunityScore: 87,
    priority: "high",
    createdAt: "2026-08-25T08:00:00Z",
    updatedAt: "2026-08-25T10:30:00Z",
    completedAt: "2026-08-25T10:30:00Z",
    researchPlan: {
      objective: "So sánh toàn diện hai model đàn piano upright Yamaha U3 và Kawai K300 để giúp người mua ra quyết định dựa trên nhu cầu thực tế.",
      questions: [
        "Sự khác biệt về cơ chế bàn phím giữa Yamaha U3 và Kawai K300?",
        "Chất lượng âm thanh và tone character của từng model?",
        "Độ bền và giá trị bảo tồn theo thời gian?",
        "Phù hợp với đối tượng người dùng nào?",
        "So sánh giá và chi phí bảo trì?",
      ],
      approach: "Thu thập đánh giá từ giáo viên piano, người dùng dài hạn, và các chuyên gia nhạc cụ.",
    },
    queries: [
      { id: "q1", query: "Yamaha U3 vs Kawai K300 comparison review", resultsCount: 18, status: "completed" },
      { id: "q2", query: "Kawai K300 action feel touch response", resultsCount: 12, status: "completed" },
      { id: "q3", query: "Yamaha U3 tone character sound quality", resultsCount: 15, status: "completed" },
      { id: "q4", query: "upright piano beginner intermediate comparison 2025", resultsCount: 9, status: "completed" },
    ],
    sources: [
      { id: "s1", url: "https://pianobuyer.com/reviews/kawai-k300", title: "Kawai K300 — Professional Review", domain: "pianobuyer.com", type: "review", relevance: 95, publishedDate: "2025-11-15", extractedInfo: "Kawai K300 sử dụng Millennium III action, phím nhẹ hơn Yamaha U3 khoảng 15%." },
      { id: "s2", url: "https://pianodreamers.com/yamaha-u3", title: "Yamaha U3 Upright Piano — In-Depth Analysis", domain: "pianodreamers.com", type: "article", relevance: 92, publishedDate: "2025-09-20", extractedInfo: "Yamaha U3 nổi tiếng về độ bền 50+ năm và giá trị tái bán cao." },
      { id: "s3", url: "https://reddit.com/r/piano", title: "Reddit: Real users compare U3 vs K300", domain: "reddit.com", type: "forum", relevance: 78, extractedInfo: "60% user chọn U3 cho phòng khách." },
    ],
    findings: [
      { id: "f1", claim: "Kawai K300 có phím nhẹ hơn Yamaha U3, phù hợp người mới học", confidence: "high", sources: ["s1", "s3"] },
      { id: "f2", claim: "Yamaha U3 có giá trị bảo tồn cao hơn theo thời gian", confidence: "high", sources: ["s2"] },
    ],
    gaps: [
      { id: "g1", title: "Thiếu so sánh cho người học trung cấp", description: "Hầu hết nội dung tập trung vào người mới hoặc chuyên nghiệp.", importance: "high", evidence: "3/4 nguồn bỏ qua nhóm intermediate." },
    ],
    opportunity: {
      score: 87, priority: "high",
      recommendation: "Nên viết bài này. Demand cao, content gap rõ ràng cho nhóm intermediate.",
      angle: "So sánh dựa trên nhu cầu thực tế thay vì chỉ spec kỹ thuật.",
      audience: "Người học piano 2-5 năm, ngân sách $3,000-$6,000.",
      reasons: ["Search volume ổn định 2,400/tháng", "Content chưa phục vụ nhóm intermediate"],
      breakdown: [
        { label: "Search Intent", score: 90 },
        { label: "Content Gap", score: 85 },
        { label: "Source Quality", score: 88 },
        { label: "Topic Relevance", score: 82 },
        { label: "Business Relevance", score: 90 },
      ],
    },
    brief: {
      title: "Yamaha U3 vs Kawai K300: Nên Chọn Cái Nào Cho Trình Độ Của Bạn?",
      searchIntent: "Người dùng muốn so sánh để ra quyết định mua.",
      targetAudience: "Người học piano trung cấp (2-5 năm).",
      objective: "Giúp người đọc chọn model phù hợp dựa trên trình độ và phong cách chơi.",
      angle: "Khung 'ai nên chọn cái nào' thay vì so sánh spec thuần túy.",
      keyQuestions: ["Action có ảnh hưởng đến việc học?", "Model nào giữ giá trị tốt hơn?"],
      outline: [
        { section: "Tổng quan nhanh", description: "Bảng so sánh 5 tiêu chí" },
        { section: "Action & cảm giác phím", description: "Millennium III vs Yamaha action" },
        { section: "Âm thanh & tone", description: "Phân tích theo thể loại nhạc" },
        { section: "Ai nên chọn cái nào?", description: "Ma trận quyết định" },
        { section: "Kết luận", description: "Khuyến nghị + FAQ" },
      ],
      keyFacts: ["Yamaha U3 sản xuất từ 1967", "Kawai K300 dùng Millennium III action"],
      draft: `# Yamaha U3 vs Kawai K300: Nên Chọn Cái Nào Cho Trình Độ Của Bạn?\n\nNếu bạn đang phân vân giữa hai model này, câu trả lời phụ thuộc hoàn toàn vào bạn là ai và bạn chơi nhạc gì.\n\n## 01. Tổng quan nhanh\n\nYamaha U3 và Kawai K300 đều là đàn upright cao cấp trong phân khúc $3,000–$5,000. Tuy nhiên chúng phục vụ hai nhóm người dùng khác nhau rõ rệt.\n\nYamaha U3 có chiều cao khoảng 131 cm [1], trong khi Kawai K300 thấp hơn ở 114 cm — điều này ảnh hưởng trực tiếp đến độ vang và depth của âm thanh.\n\n## 02. Action & cảm giác phím\n\nKawai K300 sử dụng Millennium III action [2] — cơ chế phím nhẹ hơn Yamaha U3 khoảng 15% [1]. Điều này mang lại lợi thế cho người mới học, nhưng có thể là bất lợi khi chuyển sang đàn concert sau này.\n\nYamaha U3 giữ cơ chế action truyền thống, nặng hơn và phản hồi tốt hơn cho kỹ thuật nâng cao.\n\n## 03. Âm thanh & tone\n\nCảm nhận âm thanh có thể khác nhau tùy người chơi, không gian và cách điều chỉnh đàn. Yamaha U3 thiên về bright và transparent, phù hợp classical. Kawai K300 có tone ấm hơn, thích hợp với pop và contemporary.\n\n## 04. Ai nên chọn cái nào?\n\n**Chọn Yamaha U3 nếu:** bạn học classical, có nền tảng 2+ năm, muốn đàn giữ giá trị tốt theo thời gian [2].\n\n**Chọn Kawai K300 nếu:** bạn mới bắt đầu, chơi pop/contemporary, hoặc ưu tiên action nhẹ hơn để tập luyện.\n\n## 05. Kết luận\n\n60% người dùng trong khảo sát Reddit chọn U3 cho phòng khách [3], nhưng con số này không phản ánh nhu cầu của người mới học. Với người học piano trung cấp, cả hai đều là lựa chọn tốt — quyết định nằm ở phong cách nhạc và mục tiêu dài hạn.\n\n---\n\n**Nguồn tham khảo**\n\n[1] pianobuyer.com — Kawai K300 Professional Review (2025)\n[2] pianodreamers.com — Yamaha U3 In-Depth Analysis (2025)\n[3] reddit.com/r/piano — User comparison thread`,
      mustCover: [
        "Loại action và tác động đến kỹ thuật học",
        "Âm thanh và tone character",
        "Kích thước và ảnh hưởng đến âm thanh",
        "Giá thực tế và chi phí bảo trì",
        "Đối tượng phù hợp với từng model",
      ],
      mustAvoid: [
        "Khẳng định âm thanh hay hơn mà không có nguồn cụ thể",
        "So sánh giá nếu chưa có dữ liệu thị trường VN hiện tại",
        "Dùng claim về cảm nhận cá nhân như một fact chung",
      ],
      evidenceMap: [
        { section: "01. Tổng quan nhanh", claimIds: ["f1", "f2"] },
        { section: "02. Action & cảm giác phím", claimIds: ["f1"] },
        { section: "03. Âm thanh & tone", claimIds: ["f2"] },
        { section: "04. Ai nên chọn cái nào?", claimIds: ["f1", "f2"] },
        { section: "05. Kết luận", claimIds: ["f2"] },
      ],
      contentQuality: {
        wordCount: 2450,
        sourcesUsed: 3,
        totalClaims: 8,
        citedClaims: 6,
        checks: [
          { label: "Bám Content Brief", ok: true },
          { label: "6/8 claims có nguồn", ok: true },
          { label: "Không phát hiện claim mâu thuẫn", ok: true },
          { label: "Đủ 5 section theo outline", ok: true },
          { label: "Đã kiểm tra nguồn", ok: true },
        ],
        warnings: [
          "2 claims về tone character chưa có nguồn — cần xem xét",
        ],
      },
      approvedAt: "2026-08-25T14:22:00Z",
    },
  },
  {
    id: "t002",
    title: "Best piano cho người mới bắt đầu",
    status: "processing",
    source: "user",
    opportunityScore: 72,
    priority: "medium",
    createdAt: "2026-08-26T09:00:00Z",
    updatedAt: "2026-08-28T07:00:00Z",
    researchProgress: 55,
    currentStep: "Phân tích nguồn",
    researchPlan: {
      objective: "Tìm hiểu nhu cầu của người học piano từ đầu.",
      questions: ["Digital vs acoustic cho người mới?", "Model nào được giáo viên khuyên?"],
      approach: "Phân tích bestseller và feedback người dùng.",
    },
    queries: [
      { id: "q5", query: "best piano for beginners 2025 Vietnam", resultsCount: 22, status: "completed" },
      { id: "q6", query: "đàn piano cho người mới học giá tốt", resultsCount: 14, status: "completed" },
      { id: "q7", query: "digital piano vs acoustic piano beginner", resultsCount: 11, status: "completed" },
      { id: "q8", query: "Casio CDP S100 Yamaha P45 comparison", resultsCount: 8, status: "pending" },
    ],
    sources: [
      { id: "s4", url: "https://musicradar.com/best-pianos-beginners", title: "Best Pianos for Beginners 2025", domain: "musicradar.com", type: "review", relevance: 88, publishedDate: "2025-12-01", extractedInfo: "Yamaha P-45 và Casio CDP-S100 phổ biến nhất dưới $500." },
    ],
    gaps: [],
  },
  {
    id: "t003",
    title: "Kawai K300 review chi tiết",
    status: "completed",
    source: "user",
    opportunityScore: 65,
    priority: "medium",
    createdAt: "2026-08-24T11:00:00Z",
    updatedAt: "2026-08-24T15:00:00Z",
    completedAt: "2026-08-24T15:00:00Z",
    opportunity: {
      score: 65, priority: "medium",
      recommendation: "Có thể viết, không phải ưu tiên cao.",
      angle: "Review thực tế sau 6 tháng sử dụng.",
      audience: "Người đang cân nhắc mua Kawai K300.",
      reasons: ["Search volume ổn định", "Ít review tiếng Việt chất lượng"],
      breakdown: [
        { label: "Search Intent", score: 70 },
        { label: "Content Gap", score: 65 },
        { label: "Source Quality", score: 60 },
        { label: "Topic Relevance", score: 68 },
        { label: "Business Relevance", score: 62 },
      ],
    },
    brief: {
      title: "Kawai K300 Review: Đánh Giá Sau 6 Tháng Sử Dụng",
      searchIntent: "Informational — đánh giá thực tế trước khi mua.",
      targetAudience: "Người học piano trung cấp.",
      objective: "Đánh giá thực tế, không thiên vị.",
      angle: "Trải nghiệm 6 tháng, không chỉ unbox.",
      keyQuestions: ["Action sau thời gian dài?", "Bảo trì ra sao?"],
      outline: [
        { section: "Thông số kỹ thuật", description: "Specs chính" },
        { section: "Trải nghiệm action", description: "Millennium III sau 6 tháng" },
        { section: "Kết luận", description: "Nên mua không?" },
      ],
      keyFacts: ["Kawai K300 ra mắt 2018", "Giá ~$3,200"],
      draft: "# Kawai K300 Review\n\nSau 6 tháng sử dụng hàng ngày...",
    },
  },
  {
    id: "t004",
    title: "Yamaha Clavinova CLP-745 review",
    status: "pending",
    source: "user",
    createdAt: "2026-08-28T06:00:00Z",
    updatedAt: "2026-08-28T06:00:00Z",
  },
  {
    id: "t005",
    title: "Roland FP-90X vs Kawai ES920",
    status: "failed",
    source: "user",
    createdAt: "2026-08-27T14:00:00Z",
    updatedAt: "2026-08-27T16:30:00Z",
  },
  {
    id: "t006",
    title: "Cách chọn đàn piano cho trẻ em",
    status: "pending",
    source: "user",
    createdAt: "2026-08-28T07:00:00Z",
    updatedAt: "2026-08-28T07:00:00Z",
  },
  // AI-discovered topics added to queue
  {
    id: "t007",
    title: "Piano cơ hay piano điện?",
    status: "pending",
    source: "ai",
    opportunityScore: 92,
    priority: "high",
    createdAt: "2026-08-28T08:55:00Z",
    updatedAt: "2026-08-28T08:55:00Z",
  },
];

// ── AI Control mock data ───────────────────────────────────────────────────

export interface AIRunStep {
  id: string;
  label: string;
  status: "completed" | "failed" | "skipped";
  duration: number; // ms
  inputSummary?: string;
  outputSummary?: string;
}

export interface AIRun {
  id: string;
  topicTitle: string;
  topicId?: string;
  status: "completed" | "failed" | "partial";
  startedAt: string;
  duration: number; // seconds
  model: string;
  promptVersion: string;
  sourcesFound: number;
  sourcesAccepted: number;
  claimsExtracted: number;
  claimsGrounded: number;
  confidence: "high" | "medium" | "low";
  steps: AIRunStep[];
}

export interface AIFeedbackItem {
  id: string;
  runId: string;
  topicTitle: string;
  thumbs: "up" | "down";
  category?: string;
  comment?: string;
  date: string;
}

export const MOCK_AI_RUNS: AIRun[] = [
  {
    id: "R-10294",
    topicTitle: "Yamaha U3 vs Kawai K300",
    topicId: "t001",
    status: "completed",
    startedAt: "2026-08-25T08:00:00Z",
    duration: 38.4,
    model: "claude-sonnet-5",
    promptVersion: "research-v3.2",
    sourcesFound: 21,
    sourcesAccepted: 14,
    claimsExtracted: 37,
    claimsGrounded: 35,
    confidence: "high",
    steps: [
      { id: "s1", label: "Query generation", status: "completed", duration: 1200, inputSummary: "Topic title + context", outputSummary: "4 queries tạo ra" },
      { id: "s2", label: "Web search", status: "completed", duration: 4800, inputSummary: "4 queries", outputSummary: "21 nguồn tìm thấy" },
      { id: "s3", label: "Source filtering", status: "completed", duration: 2100, inputSummary: "21 nguồn thô", outputSummary: "14 nguồn accepted (relevance ≥ 70)" },
      { id: "s4", label: "Claim extraction", status: "completed", duration: 8200, inputSummary: "14 nguồn", outputSummary: "37 claims được extract" },
      { id: "s5", label: "Evidence grounding", status: "completed", duration: 6400, inputSummary: "37 claims", outputSummary: "35/37 claims có evidence, 2 flagged" },
      { id: "s6", label: "Content gap analysis", status: "completed", duration: 3900, inputSummary: "Claims + sources", outputSummary: "1 khoảng trống quan trọng phát hiện" },
      { id: "s7", label: "Opportunity scoring", status: "completed", duration: 2300, inputSummary: "Gap + signals", outputSummary: "Score: 87/100" },
      { id: "s8", label: "Brief generation", status: "completed", duration: 9500, inputSummary: "Evidence + outline", outputSummary: "Brief 2,450 từ tạo xong" },
    ],
  },
  {
    id: "R-10281",
    topicTitle: "Kawai K300 review chi tiết",
    topicId: "t003",
    status: "completed",
    startedAt: "2026-08-24T11:00:00Z",
    duration: 31.7,
    model: "claude-sonnet-5",
    promptVersion: "research-v3.2",
    sourcesFound: 15,
    sourcesAccepted: 10,
    claimsExtracted: 24,
    claimsGrounded: 24,
    confidence: "high",
    steps: [
      { id: "s1", label: "Query generation", status: "completed", duration: 1100, outputSummary: "3 queries" },
      { id: "s2", label: "Web search", status: "completed", duration: 3900, outputSummary: "15 nguồn" },
      { id: "s3", label: "Source filtering", status: "completed", duration: 1800, outputSummary: "10 accepted" },
      { id: "s4", label: "Claim extraction", status: "completed", duration: 7100, outputSummary: "24 claims" },
      { id: "s5", label: "Evidence grounding", status: "completed", duration: 5200, outputSummary: "24/24 grounded" },
      { id: "s6", label: "Content gap analysis", status: "completed", duration: 2800, outputSummary: "2 gaps" },
      { id: "s7", label: "Opportunity scoring", status: "completed", duration: 2100, outputSummary: "Score: 65/100" },
      { id: "s8", label: "Brief generation", status: "completed", duration: 7700, outputSummary: "Brief tạo xong" },
    ],
  },
  {
    id: "R-10268",
    topicTitle: "Roland FP-90X vs Kawai ES920",
    status: "failed",
    startedAt: "2026-08-27T14:00:00Z",
    duration: 12.1,
    model: "claude-sonnet-5",
    promptVersion: "research-v3.2",
    sourcesFound: 8,
    sourcesAccepted: 4,
    claimsExtracted: 0,
    claimsGrounded: 0,
    confidence: "low",
    steps: [
      { id: "s1", label: "Query generation", status: "completed", duration: 1000, outputSummary: "3 queries" },
      { id: "s2", label: "Web search", status: "completed", duration: 3200, outputSummary: "8 nguồn" },
      { id: "s3", label: "Source filtering", status: "completed", duration: 1400, outputSummary: "4 accepted" },
      { id: "s4", label: "Claim extraction", status: "failed", duration: 6500, outputSummary: "API timeout sau 6.5s" },
      { id: "s5", label: "Evidence grounding", status: "skipped", duration: 0 },
      { id: "s6", label: "Content gap analysis", status: "skipped", duration: 0 },
      { id: "s7", label: "Opportunity scoring", status: "skipped", duration: 0 },
      { id: "s8", label: "Brief generation", status: "skipped", duration: 0 },
    ],
  },
  {
    id: "R-10255",
    topicTitle: "Best piano cho người mới bắt đầu",
    topicId: "t002",
    status: "partial",
    startedAt: "2026-08-26T09:00:00Z",
    duration: 24.3,
    model: "claude-sonnet-5",
    promptVersion: "research-v3.1",
    sourcesFound: 22,
    sourcesAccepted: 11,
    claimsExtracted: 18,
    claimsGrounded: 14,
    confidence: "medium",
    steps: [
      { id: "s1", label: "Query generation", status: "completed", duration: 1300, outputSummary: "4 queries" },
      { id: "s2", label: "Web search", status: "completed", duration: 5100, outputSummary: "22 nguồn" },
      { id: "s3", label: "Source filtering", status: "completed", duration: 2200, outputSummary: "11 accepted" },
      { id: "s4", label: "Claim extraction", status: "completed", duration: 7800, outputSummary: "18 claims" },
      { id: "s5", label: "Evidence grounding", status: "completed", duration: 4900, outputSummary: "14/18 grounded, 4 low-confidence" },
      { id: "s6", label: "Content gap analysis", status: "completed", duration: 2000, outputSummary: "3 gaps" },
      { id: "s7", label: "Opportunity scoring", status: "completed", duration: 1000, outputSummary: "Score: 72/100" },
      { id: "s8", label: "Brief generation", status: "skipped", duration: 0, outputSummary: "Skipped — research còn đang chạy" },
    ],
  },
];

export const AI_QUALITY_TREND = [
  { date: "22/08", score: 86 },
  { date: "23/08", score: 88 },
  { date: "24/08", score: 91 },
  { date: "25/08", score: 89 },
  { date: "26/08", score: 93 },
  { date: "27/08", score: 90 },
  { date: "28/08", score: 94 },
];

export const MOCK_AI_FEEDBACK: AIFeedbackItem[] = [
  { id: "fb1", runId: "R-10294", topicTitle: "Yamaha U3 vs Kawai K300", thumbs: "up", date: "25/08" },
  { id: "fb2", runId: "R-10281", topicTitle: "Kawai K300 review chi tiết", thumbs: "up", date: "24/08" },
  { id: "fb3", runId: "R-10255", topicTitle: "Best piano cho người mới", thumbs: "down", category: "Thiếu nguồn", comment: "Search Signals 88 nhưng không thấy dữ liệu tương ứng", date: "27/08" },
  { id: "fb4", runId: "R-10268", topicTitle: "Roland FP-90X vs Kawai ES920", thumbs: "down", category: "Sai thông tin", comment: "Điểm cơ hội sai so với thực tế thị trường", date: "27/08" },
  { id: "fb5", runId: "R-10294", topicTitle: "Yamaha U3 vs Kawai K300", thumbs: "up", date: "26/08" },
  { id: "fb6", runId: "R-10281", topicTitle: "Kawai K300 review chi tiết", thumbs: "up", date: "25/08" },
];

export const RESEARCH_STEPS = [
  { id: "planning", label: "Lên kế hoạch nghiên cứu" },
  { id: "queries", label: "Tạo search queries" },
  { id: "search", label: "Tìm kiếm web" },
  { id: "collection", label: "Thu thập nguồn" },
  { id: "analysis", label: "Phân tích nguồn" },
  { id: "gaps", label: "Phát hiện information gaps" },
  { id: "opportunity", label: "Đánh giá cơ hội nội dung" },
  { id: "brief", label: "Tạo content brief" },
];
