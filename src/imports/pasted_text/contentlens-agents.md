1. Ba Agent của ContentLens
Agent 1 — Research Agent

Nhiệm vụ: Tìm hiểu topic và thu thập dữ liệu từ Internet.

Input:

Yamaha U3 vs Kawai K300

Agent thực hiện:

Topic
 ↓
Xác định mục tiêu nghiên cứu
 ↓
Tạo Research Plan
 ↓
Tạo Search Queries
 ↓
Tìm kiếm Web
 ↓
Thu thập Sources
 ↓
Trích xuất thông tin quan trọng
Output
Research Plan
Research Questions
Search Queries
Sources
Thông tin được lấy từ từng nguồn

Ví dụ:

Topic: Yamaha U3 vs Kawai K300

Search queries:

Yamaha U3 specifications
Kawai K300 specifications
Yamaha U3 vs Kawai K300
Yamaha U3 review
Kawai K300 review
2. Agent 2 — Analysis Agent

Nhiệm vụ: Đọc toàn bộ nguồn mà Research Agent thu thập và biến chúng thành insight có thể sử dụng.

Input:

Research Plan
+
Sources
+
Extracted Information

Agent thực hiện:

Sources
 ↓
Tổng hợp thông tin
 ↓
So sánh các nguồn
 ↓
Tìm Key Findings
 ↓
Tìm thông tin mâu thuẫn
 ↓
Tìm Information Gaps
 ↓
Đánh giá Content Opportunity
Output
Research Summary
Key Findings
Source Comparison
Conflicting Information
Information Gaps
Content Opportunity
Recommended Content Angle

Ví dụ:

Các bài hiện có tập trung nhiều vào thông số kỹ thuật nhưng ít giải thích model nào phù hợp với từng nhóm người mua.

→ Đây chính là Information Gap.

3. Agent 3 — Content Agent

Nhiệm vụ: Dựa trên kết quả research + analysis để xây dựng nội dung.

Input:

Research Result
+
Analysis
+
Information Gaps
+
Content Opportunity

Agent thực hiện:

Content Opportunity
 ↓
Xác định Content Angle
 ↓
Tạo Title
 ↓
Xác định Search Intent
 ↓
Xác định Audience
 ↓
Tạo Outline
 ↓
Tạo Content Brief
 ↓
Có thể tạo Draft
Output
Title
Search Intent
Target Audience
Content Objective
Content Angle
Key Questions
Outline
Key Facts
Content Brief
Draft Article
Tổng thể chỉ là
                    TOPIC
                      │
                      ▼
             ┌─────────────────┐
             │  RESEARCH AGENT │
             └────────┬────────┘
                      │
             Research + Sources
                      │
                      ▼
             ┌─────────────────┐
             │  ANALYSIS AGENT │
             └────────┬────────┘
                      │
           Insights + Gaps
                      │
                      ▼
             ┌─────────────────┐
             │  CONTENT AGENT  │
             └────────┬────────┘
                      │
                      ▼
              CONTENT BRIEF
                 / DRAFT
                      │
                      ▼
                HUMAN REVIEW
Có cần Review Agent không?

MVP: không cần.

Review nên là Human Review, không phải thêm một AI agent.

Người dùng nhìn kết quả:

“Thông tin này đúng không?”
“Nguồn này có đáng tin không?”
“Content angle này có phù hợp không?”

rồi:

Approve / Request Changes

Sau này nếu cần mới thêm AI Review Agent để kiểm tra factuality, citation coverage, hallucination...

4. Dashboard có gì?

Dashboard không phải nơi để user làm toàn bộ công việc.

Nó là màn hình:

“Tình hình ContentLens hiện tại như thế nào?”

Mình sẽ thiết kế Dashboard rất gọn.

Header

Tổng quan

Theo dõi tình trạng nghiên cứu và các cơ hội nội dung.

Hàng 1 — Tổng quan nhanh

4–5 card:

Tổng chủ đề
24

Tổng số topic trong hệ thống.

Đang nghiên cứu
5

Các topic AI đang xử lý.

Chờ nghiên cứu
8

Topic đang nằm trong queue.

Đã hoàn thành
11

Topic đã có kết quả research.

Cơ hội cao
6

Topic có Content Opportunity cao.

5. Phần quan trọng nhất Dashboard
Chủ đề cần chú ý

Ví dụ:

Chủ đề	Trạng thái	Cơ hội	Cập nhật
Yamaha U3 vs Kawai K300	Hoàn thành	Cao	5 phút trước
Piano cho người mới	Đang nghiên cứu	—	10 phút trước
Yamaha U1 vs U3	Hoàn thành	Cao	1 giờ trước

Có nút:

Xem chi tiết →

6. Tiến trình nghiên cứu

Một card nhỏ:

Tiến trình nghiên cứu
Chờ xử lý        8
Đang nghiên cứu  5
Phân tích        2
Hoàn thành       11
Thất bại         1

Có thể dùng progress bar đơn giản.

Không cần biểu đồ phức tạp.

7. Cơ hội nội dung

Đây là phần rất đáng để đưa lên Dashboard.

Cơ hội nội dung nổi bật
Yamaha U3 vs Kawai K300

87/100
Cơ hội cao

→ Xem cơ hội
Piano cho trẻ em

82/100
Cơ hội cao

→ Xem cơ hội
Yamaha U1 Review

74/100
Cơ hội trung bình

→ Xem cơ hội

User nhìn vào đây là biết:

“Hôm nay nên nghiên cứu/viết cái gì?”

8. Hoạt động gần đây

Ở cuối Dashboard:

10:32  Research hoàn thành
      Yamaha U3 vs Kawai K300

10:15  Topic mới được thêm
      Piano cho người mới

09:48  Content Brief được tạo
      Yamaha U1 Review

09:20  Research thất bại
      Piano cơ cho trẻ em
9. Dashboard cuối cùng

Mình sẽ bố trí như này:

┌─────────────────────────────────────────────────────┐
│ Tổng quan                              🔍  🔔  👤   │
│ Theo dõi nghiên cứu và cơ hội nội dung              │
├──────────┬──────────┬──────────┬──────────┬────────┤
│ Tổng     │ Đang     │ Chờ      │ Hoàn     │ Cơ hội │
│ chủ đề   │ nghiên   │ xử lý    │ thành    │ cao    │
│ 24       │ 5        │ 8        │ 11       │ 6      │
└──────────┴──────────┴──────────┴──────────┴────────┘


┌──────────────────────────────────┐
│ Chủ đề cần chú ý                 │
│                                  │
│ Yamaha U3 vs Kawai K300   Cao    │
│ Piano cho người mới       Đang...│
│ Yamaha U1 vs U3           Cao    │
└──────────────────────────────────┘


┌──────────────────────────────────┐
│ Cơ hội nội dung nổi bật          │
│                                  │
│ Yamaha U3 vs Kawai K300          │
│ 87/100 · Cơ hội cao              │
│                                  │
│ Piano cho trẻ em                 │
│ 82/100 · Cơ hội cao              │
└──────────────────────────────────┘


┌──────────────────────────────────┐
│ Hoạt động gần đây                │
│                                  │
│ Research hoàn thành              │
│ Topic mới                        │
│ Content Brief được tạo           │
│ Research thất bại                │
└──────────────────────────────────┘

Không cần dashboard có 10 biểu đồ. Dự án này giá trị nằm ở research workspace, không phải analytics.

10. Navigation mình chốt như này
CONTENTLENS

Tổng quan

Nội dung
  ├── Chủ đề
  ├── Nghiên cứu
  ├── Cơ hội nội dung
  └── Content Brief

────────────

Cài đặt

Tài khoản

Trong đó:

Chủ đề → quản lý queue.

Nghiên cứu → xem các research run.

Cơ hội nội dung → xem topic nào đáng viết.

Content Brief → xem output cuối.