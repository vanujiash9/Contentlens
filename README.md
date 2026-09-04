# ContentLens

AI-powered content research platform cho doanh nghiệp piano Việt Nam. Tự động hoá toàn bộ pipeline từ khám phá chủ đề → nghiên cứu web → phân tích nguồn → tạo content brief, với lớp review của con người trước khi xuất bản.

> **Công cụ nội bộ.** AI hỗ trợ nghiên cứu — con người luôn kiểm soát và duyệt nội dung cuối cùng.

---

## Mục lục

1. [Bối cảnh nghiệp vụ](#1-bối-cảnh-nghiệp-vụ)
2. [Các module chức năng](#2-các-module-chức-năng)
3. [Luồng người dùng](#3-luồng-người-dùng)
4. [Kiến trúc kỹ thuật](#4-kiến-trúc-kỹ-thuật)
5. [Cấu trúc frontend](#5-cấu-trúc-frontend)
6. [Data model](#6-data-model)
7. [Database schema (Supabase)](#7-database-schema-supabase)
8. [AI Pipeline](#8-ai-pipeline)
9. [AI Control Center](#9-ai-control-center)
10. [Bảo mật](#10-bảo-mật)
11. [Dev setup](#11-dev-setup)
12. [Kết nối Supabase](#12-kết-nối-supabase)

---

## 1. Bối cảnh nghiệp vụ

**Vấn đề:** Đội content cần sản xuất nội dung tiếng Việt chất lượng cao (review, so sánh, hướng dẫn mua) một cách nhất quán. Nghiên cứu thủ công tốn thời gian, phủ sóng không đều, và khó xác định ưu tiên chủ đề nào sẽ tạo ra organic traffic.

**Giải pháp:** ContentLens cung cấp một command center nghiên cứu. AI khám phá và chấm điểm cơ hội nội dung, chạy nghiên cứu web đa bước tự động, sau đó tạo content brief có cấu trúc cho editor người kiểm tra và duyệt trước khi viết bài.

**Người dùng chính:**
- **Content editor** — review brief do AI tạo, duyệt hoặc yêu cầu chỉnh sửa, viết bài hoàn chỉnh
- **Content strategist** — ưu tiên chủ đề, theo dõi điểm cơ hội, phát hiện khoảng trống nội dung
- **Admin / AI engineer** — giám sát chất lượng AI run, xem log lỗi, tinh chỉnh prompt version

**Domain:** Piano và keyboard instrument tại thị trường Việt Nam (Yamaha, Kawai, Roland). Loại nội dung: bài so sánh, hướng dẫn mua, review thương hiệu.

---

## 2. Các module chức năng

### Tổng quan (Dashboard)
Dashboard hiển thị trạng thái pipeline nghiên cứu ở cái nhìn tổng quan.
- **KPI tiles:** tổng chủ đề, đang xử lý, hoàn thành, thất bại
- **Donut chart trạng thái:** phân phối pending / processing / completed / failed
- **Bar chart tốc độ nghiên cứu:** số topic hoàn thành mỗi ngày trong 7 ngày qua
- **AI discovery preview:** top 3 chủ đề mới được đề xuất kèm điểm cơ hội
- **Activity feed:** log thời gian thực các sự kiện hệ thống (research xong, brief tạo, AI discovery chạy, lỗi)
- **Quick actions:** nút điều hướng sang Topics Queue, Discovery, Content Briefs

### Chủ đề / Topics Queue
Hàng đợi trung tâm cho tất cả research job.
- **Thêm / import chủ đề** thủ công hoặc từ AI Discovery
- **Filter + search** theo trạng thái (Chờ / Đang chạy / Hoàn thành / Lỗi)
- **Bắt đầu nghiên cứu** — kích hoạt pipeline 8 bước với progress bar real-time và nhãn bước hiện tại
- **Xem chi tiết** — mở Topic Detail view cho topic đã hoàn thành
- **Thử lại** topic thất bại; **Xoá** bất kỳ topic nào (huỷ timer đang chạy)
- Prop `extraTopics` merge các topic từ Discovery vào mà không trùng lặp

### Topic Detail (8 tab)
Xem chi tiết sâu từng topic đã nghiên cứu.

| Tab | Nội dung |
|-----|---------|
| **Tổng quan** | Tracker tiến trình 8 bước, stat card (nguồn, phát hiện, khoảng trống) |
| **Kế hoạch** | Mục tiêu nghiên cứu, cách tiếp cận, câu hỏi chính |
| **Queries** | Tất cả search queries được tạo, số kết quả, trạng thái |
| **Nguồn** | Từng trang web thu thập với URL, domain, điểm liên quan, loại nguồn |
| **Phân tích** | Các phát hiện / claim đã trích xuất kèm mức độ tin cậy và nguồn dẫn |
| **Khoảng trống** | Information gaps phát hiện bởi AI với mức độ quan trọng |
| **Cơ hội** | Breakdown điểm cơ hội (Search Signal, Content Gap, Business Relevance) |
| **Content Brief** | Brief đầy đủ có thể chỉnh sửa, AI edit assistant, lưu nháp, duyệt / yêu cầu sửa |

### Cơ hội nội dung (Opportunities)
View ưu tiên tất cả các topic đã được chấm điểm.
- Nhóm topic theo 3 tầng: **Cao (≥80) / Trung bình (60–79) / Thấp (<60)**
- Hiển thị breakdown bar từng dimension
- Link trực tiếp sang Topic Detail hoặc bắt đầu viết

### Content Brief
Hàng đợi review các brief do AI tạo chờ duyệt.
- **Tab filter:** Chờ duyệt / Đã duyệt / Cần chỉnh sửa
- **Brief card:** search intent, target audience, content angle, outline preview, điểm cơ hội, quality metrics
- **Brief viewer panel:**
  - Đọc bản nháp đầy đủ (Markdown được render)
  - Sửa thủ công (textarea)
  - AI edit assistant — nhập lệnh ngôn ngữ tự nhiên, AI áp dụng vào bản nháp
  - Lưu nháp / Huỷ (quay về trạng thái đã lưu)
  - Duyệt → chuyển sang tab Đã duyệt
  - Yêu cầu chỉnh sửa → chuyển sang tab Cần chỉnh sửa

### Khám phá AI (Topic Discovery)
Engine đề xuất chủ đề dựa trên AI.
- **Config:** lĩnh vực, thị trường, khoảng thời gian, số lượng chủ đề
- **Toggle tự động khám phá:** lên lịch chạy tự động
- **Discovery card:** mỗi topic hiển thị
  - Score ring 0–100
  - 3 tín hiệu: Search Signals, Content Gap, Business Relevance — kèm điểm, nguồn, evidence
  - Content angle và lý do AI đề xuất
  - "Thêm vào hàng đợi" → gửi sang Topics Queue; "Research ngay →" gửi và điều hướng sang queue
- Nút **Thêm tất cả** để queue hàng loạt

### Nguồn tham khảo (Sources)
Registry domain-level của toàn bộ nguồn web AI đã truy cập.
- **Stats bar:** trusted / neutral / blocked domain counts, tổng nguồn
- **Bar chart:** top domain theo lượt truy cập
- **Domain table:** trust badge, category, ngôn ngữ, số lần thăm, điểm relevance trung bình
- **Domain detail drawer:** các nguồn gần đây từ domain đó
- **Quản lý trust:** đánh dấu domain Tin cậy / Chưa xác định / Chặn

### AI Control Center *(chỉ admin)*
Dashboard giám sát nội bộ cho AI research pipeline. Bảo vệ bằng PIN gate 6 chữ số.

---

## 3. Luồng người dùng

### Chủ đề mới → brief được duyệt
```
Thêm chủ đề (thủ công hoặc từ Discovery)
  → Topics Queue (trạng thái: Chờ xử lý)
  → Bắt đầu nghiên cứu → pipeline 8 bước chạy
  → Topic Detail mở khoá đầy đủ 8 tab
  → Tab Content Brief: review bản nháp
  → Trang Content Briefs: Duyệt
  → Trạng thái: Đã duyệt → editor viết bài
```

### AI discovery → nghiên cứu
```
Trang Discovery → Chạy AI discovery
  → Review các đề xuất đã chấm điểm
  → "Research ngay →" với topic tốt nhất
  → Topics Queue nhận topic (extraTopics lift)
  → Nghiên cứu bắt đầu tự động
```

### Admin giám sát chất lượng AI
```
Click avatar user trong sidebar → AI Control
  → Nhập PIN (demo: 240689)
  → Overview: tỉ lệ thành công, grounded claims %, human approval
  → AI Runs: xem breakdown từng bước per run
  → Evaluation: bar chart so sánh source acceptance, claim grounding, brief quality
  → Feedback: filter 👍/👎 theo category
```

---

## 4. Kiến trúc kỹ thuật

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                     │
│                                                      │
│  React 19  +  TypeScript 5.7  +  Vite 8             │
│  Tailwind CSS v4  +  CSS Modules  +  Recharts 3      │
│                                                      │
│  State: useState / useRef (không dùng external store)│
│  Routing: chuỗi view trong App.tsx (không React Router) │
│  Mobile: useIsMobile(768) → BottomNav / Sidebar      │
└──────────────────┬──────────────────────────────────┘
                   │  (tương lai: Supabase JS client)
┌──────────────────▼──────────────────────────────────┐
│                  Supabase (Backend)                  │
│                                                      │
│  PostgreSQL  +  Row Level Security                   │
│  Auth (email/password)                               │
│  16 bảng, 13 ENUM                                    │
└─────────────────────────────────────────────────────┘
```

**Pattern quản lý state:**
- Toàn bộ UI state nằm trong `useState` của component
- State xuyên component được lift lên `App.tsx` (ví dụ: `discoveryQueue`)
- Không Redux, Zustand, Context API — giữ đơn giản có chủ đích

**Pattern routing:**
- Một chuỗi `view` trong `App.tsx` điều khiển `renderContent()`
- Route chi tiết topic dùng template literal: `` `topic-${id}` ``
- `navigate(v)` reset `aiUnlocked` mỗi khi rời khỏi `"ai-control"`

---

## 5. Cấu trúc frontend

```
src/
├── App.tsx                          # Root: auth gate, routing, shared state
├── main.tsx                         # React entrypoint
├── index.css                        # Tailwind v4 import + global font wiring
│
├── data/
│   └── mockData.ts                  # Tất cả TypeScript interfaces + mock data
│
├── styles/
│   └── tokens.ts                    # Design tokens (colors, fontSize, fontWeight)
│
├── hooks/
│   └── useIsMobile.ts               # Breakpoint hook (mặc định 768px)
│
└── components/
    ├── layout/
    │   ├── Sidebar.tsx              # Sidebar tối, popover avatar user, nav items
    │   ├── Sidebar.module.css       # Dark theme (#111827 bg)
    │   ├── BottomNav.tsx            # Bottom bar mobile + menu sheet toàn màn hình
    │   └── BottomNav.module.css
    │
    ├── login/
    │   └── Login.tsx                # Màn hình đăng nhập email/password
    │
    ├── ui/
    │   ├── Card.tsx                 # Card + CardHeader shared components
    │   ├── PageShell.tsx            # Page wrapper có title/subtitle/actions
    │   └── RenderedDraft.tsx        # Markdown renderer cho content brief
    │
    ├── overview/
    │   ├── Overview.tsx             # Dashboard với charts + activity feed
    │   └── Overview.module.css
    │
    ├── topics/
    │   ├── TopicsQueue.tsx          # Hàng đợi research job có real-time progress
    │   ├── TopicsQueue.module.css
    │   ├── TopicDetail.tsx          # 8-tab chi tiết per topic
    │   ├── TopicDetail.module.css
    │   ├── AddTopics.tsx            # Form nhập chủ đề thủ công
    │   └── AddTopics.module.css
    │
    ├── opportunities/
    │   ├── Opportunities.tsx        # View ưu tiên topic đã chấm điểm
    │   └── Opportunities.module.css
    │
    ├── briefs/
    │   ├── ContentBriefs.tsx        # Hàng đợi review brief + viewer/editor
    │   └── ContentBriefs.module.css
    │
    ├── discovery/
    │   ├── TopicDiscovery.tsx       # Engine đề xuất chủ đề AI
    │   └── TopicDiscovery.module.css
    │
    ├── sources/
    │   ├── Sources.tsx              # Domain registry + quản lý trust
    │   └── Sources.module.css
    │
    └── aicontrol/
        ├── AIControl.tsx            # Admin: 4-tab monitoring dashboard
        └── PinGate.tsx              # PIN gate 6 chữ số có lockout
```

---

## 6. Data model

Tất cả interface định nghĩa trong `src/data/mockData.ts`.

### Entity chính

```typescript
Topic {
  id: string
  title: string
  status: "pending" | "processing" | "completed" | "failed"
  source: "user" | "ai"
  opportunityScore?: number        // 0–100
  priority?: "high" | "medium" | "low"
  researchProgress?: number        // 0–100, live khi đang processing
  currentStep?: string             // ví dụ "Phân tích nguồn"

  // Dữ liệu nghiên cứu (chỉ có sau khi completed)
  researchPlan?: ResearchPlan
  queries?: SearchQuery[]
  sources?: Source[]
  findings?: Finding[]
  gaps?: InformationGap[]
  opportunity?: Opportunity
  brief?: ContentBrief
}

ContentBrief {
  title: string
  searchIntent: string
  targetAudience: string
  objective: string
  angle: string
  keyQuestions: string[]
  outline: { section: string; description: string }[]
  keyFacts: string[]
  draft: string                    // Markdown
  mustCover?: string[]
  mustAvoid?: string[]
  evidenceMap?: { section: string; claimIds: string[] }[]
  contentQuality?: ContentQuality
}

DiscoveredTopic {
  id: string
  title: string
  opportunityScore: number
  priority: Priority
  searchSignals: SignalDetail      // { score, level, source, evidence }
  contentGap: SignalDetail
  businessRelevance: SignalDetail
  angle: string
  reasoning: string
}

DomainEntry {
  domain: string
  visitCount: number
  avgRelevance: number
  sourceTypes: string[]
  language: "vi" | "en" | "both"
  category: "review" | "forum" | "news" | "official" | "comparison" | "academic"
  trust: "trusted" | "blocked" | "neutral"
  recentSources: RecentSource[]
}
```

### Entity giám sát AI

```typescript
AIRun {
  id: string
  topicTitle: string
  topicId?: string
  status: "completed" | "failed" | "partial"
  model: string                    // ví dụ "claude-sonnet-5"
  promptVersion: string            // ví dụ "v1.2"
  sourcesFound: number
  sourcesAccepted: number
  claimsExtracted: number
  claimsGrounded: number
  confidence: "high" | "medium" | "low"
  duration: number                 // giây
  steps: AIRunStep[]
}

AIRunStep {
  id: string
  label: string
  status: "completed" | "failed" | "skipped"
  duration: number                 // ms
  inputSummary?: string
  outputSummary?: string
}

AIFeedbackItem {
  id: string
  runId: string
  topicTitle: string
  thumbs: "up" | "down"
  category?: string
  comment?: string
  date: string
}
```

### 8 bước research pipeline (theo thứ tự)

| # | ID | Nhãn tiếng Việt |
|---|-----|----------------|
| 1 | `planning`    | Lên kế hoạch nghiên cứu |
| 2 | `queries`     | Tạo search queries |
| 3 | `search`      | Tìm kiếm web |
| 4 | `collection`  | Thu thập nguồn |
| 5 | `analysis`    | Phân tích nguồn |
| 6 | `gaps`        | Phát hiện information gaps |
| 7 | `opportunity` | Đánh giá cơ hội nội dung |
| 8 | `brief`       | Tạo content brief |

### Typography scale

| Token | Size | Dùng cho |
|-------|------|---------|
| `xs` | 11px | Badge, timestamp, caption, nhãn cột |
| `sm` | 12px | Text phụ, meta, table header |
| `base` | 13px | Body, table row, mô tả |
| `md` | 14px | Card title, text nhấn |
| `lg` | 16px | Section heading (h2) |
| `xl` | 20px | Page title (h1) |

Font: **Inter** (UI), **JetBrains Mono** (số, code)

---

## 7. Database schema (Supabase)

File migration: `supabase/migrations/001_contentlens_schema.sql`

Chạy toàn bộ file này một lần trong **Supabase SQL Editor** để tạo đầy đủ schema.

### 16 bảng

| Bảng | Mô tả |
|------|-------|
| `profiles` | Mở rộng `auth.users`. Trường: name, role (admin/content) |
| `topics` | Core research job. Map 1:1 với `Topic` frontend |
| `research_plans` | Mục tiêu + câu hỏi nghiên cứu per topic |
| `search_queries` | Từng search query được tạo per topic |
| `domains` | Domain registry với trust status và stats |
| `sources` | Từng trang web thu thập per topic |
| `findings` | Claim / fact trích xuất kèm confidence level |
| `finding_sources` | Many-to-many join: findings ↔ sources |
| `information_gaps` | Content gap phát hiện per topic |
| `opportunities` | Điểm cơ hội + breakdown per topic |
| `content_briefs` | Brief đầy đủ với draft, outline, quality metrics |
| `discovered_topics` | Topic AI đề xuất chưa vào queue |
| `activity_events` | Log sự kiện hệ thống |
| `ai_runs` | Một record per AI research execution |
| `ai_run_steps` | Breakdown bước per run |
| `ai_feedback` | Feedback 👍/👎 của con người per run |

### 13 ENUM PostgreSQL

```sql
topic_status      -- pending | processing | completed | failed
priority_level    -- high | medium | low
topic_source      -- user | ai
source_type       -- official | review | article | forum | product | comparison
confidence_level  -- high | medium | low
domain_trust      -- trusted | blocked | neutral
domain_language   -- vi | en | both
domain_category   -- review | forum | news | official | comparison | academic
ai_run_status     -- completed | failed | partial
ai_step_status    -- completed | failed | skipped
brief_status      -- draft | pending_review | approved
activity_type     -- research_done | topic_added | brief_created | research_failed | research_started | ai_discovery
user_role         -- admin | content
```

### Row Level Security

| Bảng | Policy |
|------|--------|
| Tất cả bảng content (`topics`, `sources`, `findings`, `content_briefs`, v.v.) | Tất cả user đã xác thực |
| `ai_runs`, `ai_run_steps`, `ai_feedback` | Chỉ role `admin` |

### Auto-trigger

- `handle_new_user()` — fire khi INSERT vào `auth.users`, tự tạo row `profiles`
- `set_updated_at()` — fire khi UPDATE `topics` hoặc `content_briefs`, set `updated_at = now()`

### Index chính

```sql
idx_topics_created_at, idx_topics_status
idx_sources_topic_id, idx_findings_topic_id
idx_ai_run_steps_run_id, idx_ai_feedback_run_id
idx_activity_events_created_at
```

---

## 8. AI Pipeline

Pipeline nghiên cứu chạy 8 bước tuần tự per topic. Trong mock hiện tại, tiến trình được mô phỏng bằng `setInterval` (tăng 3–10% mỗi 900ms). Trong production, mỗi bước map sang một API call.

### Chi tiết từng bước (production intent)

| Bước | AI làm gì | Output |
|------|-----------|--------|
| **Planning** | Phân tích tiêu đề topic, xác định mục tiêu nghiên cứu và câu hỏi chính | Row `research_plans` |
| **Query generation** | Tạo 5–10 search query có mục tiêu cho nhiều angle khác nhau | Rows `search_queries` |
| **Web search** | Thực thi queries qua search API (Brave Search, SerpAPI) | URL thô |
| **Source collection** | Fetch và extract text từ URL top, phân loại domain + type | Rows `sources` |
| **Source analysis** | Đọc text đã extract, xác định claim thực tế kèm confidence scoring | Rows `findings` |
| **Gap detection** | Cross-reference findings với câu hỏi chính, tìm chỗ chưa có câu trả lời | Rows `information_gaps` |
| **Opportunity scoring** | Chấm điểm topic theo 3 dimension × trọng số → điểm cơ hội tổng hợp | Row `opportunities` |
| **Brief generation** | Tạo content brief có cấu trúc: outline, key facts, bản nháp đầy đủ | Row `content_briefs` |

### Công thức điểm cơ hội

```
opportunity_score = (
  search_signals     × 0.35  +   // lượng tìm kiếm, xu hướng, search intent
  content_gap        × 0.40  +   // đối thủ còn thiếu angle này
  business_relevance × 0.25      // purchase intent, brand fit
) × 100
```

### Mô hình AI

Mock data hiện dùng `claude-sonnet-5`. Trong production, từng bước có thể dùng size model khác nhau:

| Bước | Model đề xuất | Lý do |
|------|--------------|-------|
| Planning, query gen, opportunity scoring | `claude-haiku-4-5-20251001` | Nhanh, rẻ |
| Source analysis, brief generation | `claude-sonnet-5` | Chất lượng cao hơn |
| AI edit assistant trong Brief | `claude-sonnet-5` | Cần ngữ cảnh bản nháp hiện tại |

### Prompt versioning

Mỗi row `ai_runs` lưu `prompt_version` (ví dụ `"v1.2"`). Cho phép so sánh A/B các prompt trong tab Evaluation của AI Control Center.

### Lưu ý quan trọng về dữ liệu

- **Search Signals phải có nguồn thực.** Không để LLM tự ước tính search volume — phải lấy từ Google Trends API, Ahrefs, hoặc SerpAPI. LLM chỉ được diễn giải dữ liệu đã có, không tự bịa.
- **Grounded claims.** Mỗi claim trong `findings` phải linked về ít nhất một `source` có URL thật. Không chấp nhận claim "AI nói vậy" không có nguồn.

---

## 9. AI Control Center

Truy cập: click avatar user trong sidebar → **AI Control** → nhập PIN 6 chữ số.

### 4 sub-tab

**Overview**
- KPI tiles: Research Success %, Grounded Claims %, Human Approval %, AI Quality Score
- Stats phụ: tổng runs, failed runs, unsupported claims, cần human review
- Line chart xu hướng chất lượng (trung bình 7 ngày)
- Bảng run gần đây với status, model, source/claim stats

**AI Runs**
- Danh sách đầy đủ research run với expandable step detail
- Per-step: nhãn, status (✓ / ✗ / bỏ qua), duration ms, tóm tắt input/output
- Dùng để chẩn đoán lỗi — ví dụ "API timeout tại bước claim extraction"

**Evaluation**
- 3 bar chart: Source Acceptance Rate, Claim Grounding Rate, Brief Quality Score
- Dữ liệu nhóm theo prompt version để so sánh

**Feedback**
- Filter theo Tất cả / 👍 / 👎
- Mỗi item: tiêu đề topic, đánh giá, category tag, comment của editor, ngày
- Category: "Thiếu nguồn", "Sai thông tin", "Outline tốt", "Cần thêm chi tiết", …

### PIN Gate

- PIN 6 chữ số
- Demo PIN: **240689**
- Tối đa 3 lần thử sai trước khi khoá 30 giây
- On-screen keypad + bàn phím vật lý (hidden `<input type="tel">`)
- Shake animation khi sai; green unlock animation khi đúng
- `aiUnlocked` state reset trong `App.tsx` mỗi khi điều hướng ra khỏi `"ai-control"`

---

## 10. Bảo mật

### Xác thực
- Supabase Auth (email/password). Màn hình login: `src/components/login/Login.tsx`
- Hiện tại dùng boolean `loggedIn` trong `App.tsx` — thay bằng Supabase session check trong production

### Truy cập admin
- **UI level:** AI Control ẩn sau popover avatar user trong sidebar — không hiển thị trong nav chính
- **App level:** `aiUnlocked` state gate AI Control view sau `PinGate`
- **Database level:** bảng `ai_runs`, `ai_run_steps`, `ai_feedback` có RLS policy chỉ cho role `admin`

### Checklist hardening production

- [ ] Thay boolean `loggedIn` bằng `supabase.auth.getSession()`
- [ ] Thay PIN gate bằng role check thực: `profile.role === 'admin'`
- [ ] Lưu `SUPABASE_URL` và `SUPABASE_ANON_KEY` trong biến môi trường (không hardcode)
- [ ] `service_role` key chỉ dùng server-side, không bao giờ ở browser
- [ ] Bật email confirmation trong Supabase Auth settings
- [ ] Thiết lập RLS policy trước khi mở production traffic

---

## 11. Dev setup

**Yêu cầu:** Node.js 20+, pnpm 9+ (version đã pin trong `.mise.toml`)

```bash
# Cài dependencies
pnpm install

# Khởi động dev server (hot reload port 8443)
pnpm dev

# Type check
npx tsc --noEmit

# Format
pnpm format
```

Vite dev server đã được cấu hình bind `0.0.0.0` để chạy trong sandbox Figma Make. Xem preview qua preview panel.

### Config files quan trọng

| File | Mục đích |
|------|---------|
| `vite.config.ts` | Vite + React + Tailwind CSS v4 + alias `@` cho `src/` |
| `src/index.css` | `@import 'tailwindcss'` + font default toàn cục |
| `tsconfig.json` | TypeScript strict mode |
| `.mise.toml` | Toolchain versions |

### Thêm view mới

1. Thêm view ID vào type `View` trong `App.tsx`
2. Thêm case trong `renderContent()`
3. Thêm `NavItem` trong `Sidebar.tsx` (hoặc entry trong menu sheet `BottomNav.tsx`)
4. Tạo component trong `src/components/<module>/`

---

## 12. Kết nối Supabase

### Bước 1: Tạo project

Vào [supabase.com](https://supabase.com) → New Project → copy `Project URL` và `anon public` key.

### Bước 2: Chạy migration

Paste toàn bộ nội dung `supabase/migrations/001_contentlens_schema.sql` vào **Supabase SQL Editor** và chạy. Tạo đầy đủ 16 bảng, ENUM, RLS policy, trigger, và index trong một lần.

### Bước 3: Cài client

```bash
pnpm add @supabase/supabase-js
```

### Bước 4: Tạo Supabase client

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

Thêm vào `.env.local` (không commit file này):
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Bước 5: Thay thế mock data

Mỗi component hiện đọc từ `MOCK_TOPICS`, `MOCK_DOMAINS`, … trong `src/data/mockData.ts`. Thay bằng Supabase query:

```typescript
// Load topics
const { data: topics } = await supabase
  .from("topics")
  .select("*")
  .order("created_at", { ascending: false });

// Update trạng thái duyệt brief
await supabase
  .from("content_briefs")
  .update({ review_status: "approved" })
  .eq("topic_id", topicId);

// Load domain registry
const { data: domains } = await supabase
  .from("domains")
  .select(`*, sources(id, title, url, relevance, topic_id)`)
  .order("visit_count", { ascending: false });
```

### Bước 6: Wiring auth

```typescript
// Thay boolean loggedIn trong App.tsx
const { data: { session } } = await supabase.auth.getSession();
const loggedIn = session !== null;

// Đăng nhập
const { error } = await supabase.auth.signInWithPassword({ email, password });

// Đăng xuất
await supabase.auth.signOut();
```

### Mapping tên cột (camelCase frontend → snake_case DB)

| TypeScript (frontend) | Cột Supabase |
|----------------------|-------------|
| `opportunityScore` | `opportunity_score` |
| `researchProgress` | `research_progress` |
| `currentStep` | `current_step` |
| `searchIntent` | `search_intent` |
| `targetAudience` | `target_audience` |
| `keyQuestions` | `key_questions` |
| `promptVersion` | `prompt_version` |
| `sourcesFound` | `sources_found` |
| `claimsExtracted` | `claims_extracted` |
| `claimsGrounded` | `claims_grounded` |
| `startedAt` | `started_at` |
| `topicId` | `topic_id` |

Dùng aliasing trong Supabase `select()` hoặc một hàm mapper nhỏ để giữ nguyên interface frontend.
