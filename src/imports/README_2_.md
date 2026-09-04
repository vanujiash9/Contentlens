# AI Content Research Agent

## 1. Overview

AI Content Research Agent là một ứng dụng SaaS nội bộ hỗ trợ team content/marketing nghiên cứu chủ đề và tạo nội dung dựa trên web research.

Người dùng nhập một hoặc nhiều topic. Hệ thống đưa topic vào queue, sau đó AI tự động:

1. Tạo research plan
2. Tạo search queries
3. Tìm kiếm và thu thập nguồn
4. Phân tích và tổng hợp nguồn
5. Phát hiện information gaps
6. Đánh giá content opportunity
7. Tạo content brief / content draft

Người dùng vẫn là người review và quyết định kết quả cuối cùng.

### MVP không bao gồm

- Tự động đăng bài
- WordPress/CMS publishing
- Social media publishing
- Google indexing / IndexNow
- Publishing Agent
- Hệ thống tự nghĩ toàn bộ topic
- Autonomous 24/7 operation

**Output cuối cùng của MVP:** Research Result + Content Opportunity + Content Brief / Content Draft.

---

## 2. Business Goal

Giảm thời gian thủ công khi nghiên cứu content bằng cách tự động hóa phần research và phân tích, nhưng vẫn giữ human-in-the-loop.

Hệ thống cần giúp người dùng trả lời được:

- Topic này có đáng nghiên cứu/viết không?
- Người dùng có thể đang tìm kiếm điều gì?
- Các nguồn hiện có nói gì?
- Các nguồn có thông tin nào khác nhau?
- Existing content còn thiếu gì?
- Nên khai thác content angle nào?
- Nội dung cuối nên được triển khai theo hướng nào?

---

## 3. Core User Flow

```text
User
  ↓
Enter Multiple Topics
  ↓
Topic Queue
  ↓
Start Research
  ↓
Research Planning
  ↓
Search Query Generation
  ↓
Web Search & Source Collection
  ↓
Source Analysis
  ↓
Information Gap Detection
  ↓
Content Opportunity Evaluation
  ↓
Content Brief / Draft Generation
  ↓
Human Review
  ↓
Final Output
```

---

## 4. Main Modules

### 4.1 Topic Management

Người dùng có thể:

- Tạo một topic
- Nhập nhiều topic cùng lúc
- Xem danh sách topic
- Xem trạng thái topic
- Start Research
- Retry research khi thất bại

Topic queue hỗ trợ các trạng thái:

```text
pending
processing
completed
failed
```

---

### 4.2 Research

Research Agent chịu trách nhiệm:

- Hiểu topic
- Xác định research objective
- Tạo research questions
- Tạo search queries
- Thực hiện web search
- Thu thập sources

Research có thể chạy background vì quá trình research không nhất thiết hoàn thành ngay trong HTTP request.

Flow:

```text
Topic
  ↓
Research Run
  ↓
queued
  ↓
running
  ↓
completed / failed
```

---

### 4.3 Source Management

Hệ thống lưu các nguồn được sử dụng trong research.

Mỗi source có thể bao gồm:

- URL
- Title
- Domain
- Source type
- Relevance
- Published date nếu có
- Extracted information
- Findings/claims liên quan

Các loại source có thể dùng:

- Official
- Review
- Article
- Forum
- Product page
- Comparison

---

### 4.4 Analysis

Analysis Agent tổng hợp thông tin từ nhiều nguồn.

Các kết quả chính:

- Research summary
- Key findings
- Source comparison
- Conflicting information
- Confidence
- Supporting sources

Mục tiêu là không chỉ tóm tắt từng nguồn riêng lẻ mà phải tạo được góc nhìn tổng hợp.

---

### 4.5 Information Gap

Hệ thống xác định các thông tin mà existing content còn thiếu hoặc chưa giải thích tốt.

Mỗi information gap có thể bao gồm:

- Gap title
- Description
- Evidence
- Importance
- Related sources

Information gaps được dùng để xác định content angle có giá trị.

---

### 4.6 Content Opportunity

Hệ thống đánh giá topic dựa trên research.

Các yếu tố có thể dùng:

- Search intent
- Content gap
- Source quality
- Topic relevance
- Business relevance

Output:

- Opportunity score
- Priority
- Recommendation
- Recommended content angle
- Potential audience
- Reasons why the topic is worth writing

Ví dụ:

```text
Opportunity Score: 87/100
Priority: High

Recommended Angle:
Needs-based comparison instead of specification-only comparison.
```

---

### 4.7 Content Brief / Draft

Content Agent sử dụng research result và opportunity để tạo:

- Title
- Search intent
- Target audience
- Content objective
- Recommended angle
- Key questions
- Article outline
- Key facts
- Supporting sources
- Content draft

Đây là output cuối cùng của hệ thống.

Không có publishing workflow trong MVP.

---

### 4.8 Human Review

Người dùng review kết quả AI trước khi sử dụng.

Có thể kiểm tra:

- Source relevance
- Research quality
- Factual confidence
- Content relevance
- Supporting sources
- Information gaps

Actions:

```text
Approve
Request Changes
Save Draft
```

---

## 5. Main UI Screens

MVP có thể triển khai thành các màn hình chính sau:

### 5.1 Overview

Hiển thị:

- Total Topics
- Pending
- Researching
- Completed
- High Opportunity
- Topic Pipeline
- Recent Topics
- Recent Research

### 5.2 Topics / Queue

Hiển thị:

- Topic
- Status
- Research
- Opportunity
- Created
- Actions

Actions:

- Add Topics
- Start Research
- Retry
- Delete

### 5.3 Add Topics

Cho phép nhập nhiều topic, mỗi topic một dòng.

Ví dụ:

```text
Yamaha U3
Kawai K300
Yamaha U1 vs Yamaha U3
Best piano for beginners
```

### 5.4 Topic Detail

Các tab:

```text
Overview
Research Plan
Queries
Sources
Analysis
Information Gaps
Opportunity
Content Brief
```

### 5.5 Research

Hiển thị research progress:

```text
Research Planning
Query Generation
Web Search
Source Collection
Source Analysis
Information Gap
Opportunity Evaluation
Content Brief
```

### 5.6 Sources

Hiển thị danh sách nguồn và thông tin được trích xuất.

### 5.7 Analysis

Hiển thị:

- Research summary
- Key findings
- Source comparison
- Conflicting information

### 5.8 Information Gaps

Hiển thị các gap và recommended content angles.

### 5.9 Content Opportunity

Hiển thị:

- Opportunity score
- Score breakdown
- Recommendation
- Content angle
- Audience
- Reasons

### 5.10 Content Brief / Draft

Hiển thị content brief và draft cuối cùng.

### 5.11 Review

Cho phép người dùng approve hoặc request changes.

---

## 6. System Architecture

Kiến trúc tổng quan:

```text
                    USER
                      │
                      ▼
                ┌───────────┐
                │  Next.js  │
                │    FE     │
                └─────┬─────┘
                      │
                      ▼
                ┌───────────┐
                │  FastAPI  │
                │    BE     │
                └─────┬─────┘
                      │
              ┌───────┴────────┐
              ▼                ▼
        ┌───────────┐    ┌───────────┐
        │ LangGraph │    │ PostgreSQL│
        │ AI Agent  │    │ / Supabase│
        └─────┬─────┘    └───────────┘
              │
       ┌──────┼─────────┐
       ▼      ▼         ▼
     Search  LLM      Parser
```

FE không cần biết chi tiết về LangGraph, prompt, LLM hay database.

FE giao tiếp với BE thông qua API.

---

## 7. FE / BE Responsibility

### Frontend

Frontend chịu trách nhiệm:

- UI/UX
- Routing
- Form
- Topic Queue
- Research progress
- Source display
- Analysis display
- Opportunity display
- Content Brief / Draft
- Loading states
- Empty states
- Error states
- API integration

Frontend dùng mock data trong giai đoạn phát triển UI.

### Backend

Backend chịu trách nhiệm:

- FastAPI
- Database
- Business logic
- Topic management
- Research execution
- Background processing
- LangGraph workflow
- Search integration
- LLM integration
- Source processing
- Analysis
- Information Gap
- Opportunity evaluation
- Content Brief / Draft generation
- Error handling
- Logging
- Backend testing

---

## 8. FE / BE Integration

FE và BE không cần thiết kế toàn bộ hệ thống cùng lúc.

Trước khi integration một feature, hai bên cần thống nhất tối thiểu:

### API

Ví dụ:

```http
GET  /api/topics
POST /api/topics
GET  /api/topics/{topic_id}

POST /api/topics/{topic_id}/research

GET /api/research-runs/{run_id}
GET /api/research-runs/{run_id}/sources
GET /api/research-runs/{run_id}/analysis
GET /api/research-runs/{run_id}/opportunity
GET /api/research-runs/{run_id}/content-brief
```

### Request / Response

FE cần biết:

- Gọi endpoint nào
- Gửi dữ liệu gì
- Nhận dữ liệu gì
- Field name
- Data type
- Status code
- Error format

Ví dụ:

```json
{
  "id": "topic_001",
  "title": "Yamaha U3 vs Kawai K300",
  "status": "completed",
  "created_at": "2026-08-28T10:00:00Z"
}
```

### Status

FE và BE sử dụng cùng enum:

```text
pending
processing
completed
failed
```

Không tự đổi tên giữa hai bên.

---

## 9. Data Entities

Core entities:

```text
Topic
ResearchRun
SearchQuery
Source
Finding
InformationGap
Opportunity
ContentBrief
```

Relationship:

```text
Topic
  │
  └── ResearchRun
        │
        ├── SearchQuery
        ├── Source
        ├── Finding
        ├── InformationGap
        ├── Opportunity
        └── ContentBrief
```

Database implementation có thể thay đổi trong quá trình development nếu không ảnh hưởng đến API contract.

---

## 10. AI Research Workflow

AI workflow dự kiến sử dụng LangGraph.

```text
START
  ↓
Research Planner
  ↓
Query Generator
  ↓
Search
  ↓
Source Collection
  ↓
Source Analysis
  ↓
Information Gap Detection
  ↓
Opportunity Evaluation
  ↓
Content Brief Generator
  ↓
END
```

AI workflow có thể được điều chỉnh trong quá trình development.

Không yêu cầu FE biết số lượng node hoặc cách các node triển khai bên trong.

---

## 11. Development Strategy

Không cần đóng băng toàn bộ thiết kế trước khi code.

Nguyên tắc:

```text
Design enough
  ↓
Build
  ↓
Test
  ↓
Identify real-world issues
  ↓
Update design/contract if necessary
  ↓
Continue
```

API contract là cầu nối giữa FE và BE nhưng có thể được cập nhật khi phát sinh yêu cầu thực tế.

Ưu tiên integration sớm theo từng feature thay vì chờ toàn bộ BE hoàn thành.

### Suggested integration milestones

```text
Milestone 1
Topic Management
FE ↔ BE

Milestone 2
Research
FE ↔ BE

Milestone 3
Sources + Analysis
FE ↔ BE

Milestone 4
Opportunity + Content Brief
FE ↔ BE

Milestone 5
End-to-end testing
```

---

## 12. MVP Scope

### Must Have

- Multiple topic input
- Topic queue
- Topic status
- Research plan
- Search query generation
- Web search
- Source collection
- Source analysis
- Information gap
- Content opportunity
- Content brief
- Content draft
- Human review
- Persistent storage
- Error handling
- Retry

### Not Required for MVP

- Automatic publishing
- WordPress
- Social media
- IndexNow
- CMS
- Autonomous topic generation
- 24/7 autonomous execution
- Advanced analytics
- Complex user permission system
- Advanced scheduling

---

## 13. Definition of Done

MVP được xem là hoàn thành khi:

1. User có thể nhập nhiều topic.
2. Topic được đưa vào queue.
3. User có thể start research.
4. Research chạy background.
5. AI tạo research plan.
6. AI tạo search queries.
7. Hệ thống tìm và lưu sources.
8. AI phân tích sources.
9. AI phát hiện information gaps.
10. AI đánh giá content opportunity.
11. AI tạo content brief/draft.
12. User có thể xem toàn bộ research result.
13. User có thể review kết quả.
14. User có thể retry khi research thất bại.
15. FE hiển thị đúng dữ liệu từ BE.
16. Không có bước auto-publish.

---

## 14. Guiding Principles

### Keep the MVP controlled

AI hỗ trợ research và content creation, nhưng user vẫn quyết định kết quả cuối cùng.

### Avoid unnecessary complexity

Không thêm service, agent, database hoặc integration nếu MVP chưa cần.

### Integration early

FE và BE nên kết nối từng feature ngay khi feature đó đủ ổn định.

### Contract, not bureaucracy

API contract tồn tại để FE và BE hiểu giống nhau, không phải để tạo tài liệu nặng.

### Build from overview to detail

```text
Business
→ User Flow
→ UI
→ Data
→ API
→ AI Workflow
→ Implementation
→ Integration
→ Testing
```

---

## 15. Final Product Flow

```text
                 USER
                   │
                   ▼
             ENTER TOPICS
                   │
                   ▼
              TOPIC QUEUE
                   │
                   ▼
             START RESEARCH
                   │
                   ▼
          ┌──────────────────┐
          │  RESEARCH AGENT  │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │  ANALYSIS AGENT  │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │  CONTENT AGENT   │
          └────────┬─────────┘
                   │
                   ▼
          CONTENT BRIEF / DRAFT
                   │
                   ▼
              HUMAN REVIEW
                   │
                   ▼
                 OUTPUT
```

The MVP ends at the final content output. There is no automatic publishing step.
