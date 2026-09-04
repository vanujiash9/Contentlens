Đúng, **đây mới là phần quan trọng nhất cần làm kỹ**. Nhìn 2 màn hình bạn gửi, mình thấy phần Content Brief hiện tại khá ổn về UI, nhưng **Content Draft đang bị xem như một ô output cuối cùng**, trong khi nếu để LLM viết một phát toàn bài thì rất dễ ra bài chung chung, lặp ý, hallucination và không bám research.

Nếu là mình làm ContentLens, mình sẽ **đổi cách AI tạo content**, chứ không chỉ sửa prompt.

---

# 1. Vấn đề hiện tại của bạn

Flow hiện tại có vẻ là:

```text
Research
   ↓
Brief
   ↓
LLM
   ↓
Content Draft
```

Vấn đề là AI nhìn:

> Title + outline + vài key facts

rồi tự viết.

Thế thì nó rất dễ thành kiểu:

> "Yamaha U3 và Kawai K300 đều là những cây đàn piano upright chất lượng cao..."

→ nghe đúng nhưng **không có giá trị nghiên cứu**.

Trong khi giá trị của ContentLens nằm ở:

> **AI đã research 10–20 nguồn trước đó.**

Vậy **content phải tận dụng research đó**, không được bỏ qua research rồi viết lại từ đầu.

---

# 2. Tôi đề xuất pipeline Content mới

Không:

```text
Brief → Generate Article
```

Mà:

```text
RESEARCH
   ↓
Sources
   ↓
Extracted Facts / Claims
   ↓
Analysis
   ↓
Content Gap
   ↓
Content Strategy
   ↓
Brief
   ↓
Section Planning
   ↓
Section Research
   ↓
Generate Section
   ↓
Fact Check
   ↓
Article Assembly
   ↓
Final Review
   ↓
FINAL CONTENT
```

Đây mới là phần AI Engineer đáng làm.

---

# 3. Quan trọng nhất: tạo "Evidence / Claims" trước

Ví dụ topic:

> **Yamaha U3 vs Kawai K300**

AI research 15 nguồn.

Không nên chỉ lưu:

```text
Source 1
Source 2
Source 3
...
```

Mà phải extract thành:

### Evidence

```text
Claim:
Yamaha U3 có chiều cao khoảng 131 cm.

Source:
Yamaha official

Evidence:
...

Confidence:
High
```

---

### Một claim khác

```text
Claim:
Kawai K300 sử dụng Millennium III action.

Source:
Kawai official

Evidence:
...

Confidence:
High
```

---

### Một claim khác

```text
Claim:
Chiều cao đàn có thể ảnh hưởng đến đặc tính âm thanh
và không gian cộng hưởng.

Sources:
A
B
C

Confidence:
Medium
```

Như vậy Writer **không cần tự nhớ kiến thức**.

Nó lấy từ:

```text
Evidence Store
```

---

# 4. Writer không được phép "bịa thêm"

Prompt của Writer nên có nguyên tắc rất rõ:

> **Chỉ sử dụng factual claims đã được cung cấp trong evidence.**

Nếu muốn viết:

> "Yamaha U3 có âm thanh sáng hơn Kawai K300"

thì phải tìm được evidence.

Nếu không có:

```text
❌ Không được khẳng định
```

Có thể viết:

> "Cảm nhận âm thanh có thể khác nhau tùy người chơi, không gian và cách điều chỉnh đàn."

Hoặc:

```text
[Need evidence]
```

---

# 5. Nhưng đừng bắt AI viết cả bài một lần

Đây là điểm mình **rất khuyên bạn sửa**.

Outline của bạn:

```text
01 Tổng quan nhanh
02 Action & cảm giác phím
03 Âm thanh & tone
04 Ai nên chọn cái nào?
05 Kết luận
```

Writer nên chạy:

```text
Section 01
   ↓
Generate
   ↓
Fact check
   ↓
Section 02
   ↓
Generate
   ↓
Fact check
...
```

Thay vì:

```text
Generate 3000 words
```

---

# 6. Mỗi section phải có "evidence riêng"

Ví dụ:

## Section 02 — Action & cảm giác phím

Backend đưa cho Writer:

```text
SECTION GOAL
So sánh action và tác động đến trải nghiệm chơi.

EVIDENCE
- Yamaha U3: ...
- Kawai K300: ...
- Source A: ...
- Source B: ...

CONTENT GAP
Các bài hiện tại thường chỉ liệt kê loại action,
chưa giải thích cho người mua trung cấp.

TARGET AUDIENCE
Người học piano 2–5 năm.

ANGLE
Giải thích theo trải nghiệm người chơi,
không chỉ đọc thông số.
```

AI mới viết.

Kết quả sẽ khác hẳn.

---

# 7. Và phải có Citation

Đây là thứ mình thấy **rất nên thêm vào ContentLens**.

Ví dụ output:

> Yamaha U3 có chiều cao khoảng 131 cm. **[1]**

> Kawai K-300 sử dụng Millennium III action. **[2]**

Cuối bài:

```text
Nguồn tham khảo

[1] Yamaha — ...
[2] Kawai — ...
[3] Piano Buyer — ...
```

Hoặc trong UI có thể hiển thị:

> `⌁ Source 1`

Click vào → source.

---

# 8. Đừng để citation là thứ AI tự bịa

Backend phải quản lý:

```text
claim_id
source_id
source_url
source_quote
confidence
```

Ví dụ:

```text
Claim #182
│
├── statement
│   "Kawai K300 sử dụng Millennium III action"
│
├── source_id
│   38
│
├── source_url
│
├── evidence
│
└── confidence
    HIGH
```

Writer chỉ reference `claim_id`.

Đây là cách giảm hallucination rất mạnh.

---

# 9. Content Brief của bạn cũng nên sửa nhẹ

Hiện tại bạn có:

> Search Intent
> Đối tượng mục tiêu
> Mục tiêu nội dung
> Content Angle
> Câu hỏi chính
> Dữ kiện chính
> Outline

**Rất ổn.**

Nhưng tôi sẽ thêm 3 thứ:

### ① Must Cover

```text
Bắt buộc đề cập:

✓ Action
✓ Âm thanh
✓ Kích thước
✓ Giá
✓ Đối tượng phù hợp
```

### ② Must Avoid

```text
Không:
- So sánh dựa trên cảm nhận không có nguồn
- Khẳng định giá nếu chưa có dữ liệu
- Dùng claim không có evidence
```

### ③ Evidence Map

```text
Section 1
→ Claims 12, 18, 25

Section 2
→ Claims 31, 32, 40

Section 3
→ Claims 44, 47
```

Cái này **rất có giá trị cho BE/AI**, dù user bình thường không nhất thiết phải nhìn thấy.

---

# 10. UI Content Draft tôi sẽ đổi thành thế này

Thay vì:

> **Content Draft ▼**

một ô dài.

Cho user thấy:

```text
CONTENT

Trạng thái: Đã tạo
Độ dài: 2,450 từ
Nguồn được sử dụng: 14
Claims: 37
Claims có nguồn: 35/37
```

---

### Preview

```text
Yamaha U3 vs Kawai K300:
Nên Chọn Cái Nào Cho Trình Độ Của Bạn?

[Intro]

...

01. Tổng quan nhanh

...

02. Action & cảm giác phím

...

03. Âm thanh & tone

...

04. Ai nên chọn cái nào?

...

05. Kết luận
```

---

# 11. Bên phải có "AI Quality"

Không cần làm dashboard phức tạp.

Chỉ cần:

```text
CONTENT QUALITY

✓ Bám Content Brief
✓ 35/37 claims có nguồn
✓ Không phát hiện claim mâu thuẫn
✓ Đủ 5 section
✓ Đã kiểm tra nguồn

⚠ 2 claims cần review
```

Sau đó:

**[Xem 2 claims]**

---

# 12. Human vẫn phải được quyền sửa

Cuối cùng:

```text
┌──────────────────────────────┐
│        FINAL CONTENT         │
│                              │
│  Editable content            │
│                              │
└──────────────────────────────┘

[ Lưu nháp ] [ Yêu cầu AI sửa ] [ Duyệt ]
```

Và nếu user sửa:

> "Viết lại phần 3 ngắn hơn, tập trung vào người mới."

AI **chỉ regenerate section 3**, không viết lại toàn bài.

Đây là UX rất quan trọng.

---

# 13. Tôi sẽ chia AI thành 4 nhiệm vụ

Không cần thêm 10 agent.

### Agent 1 — Research Agent

```text
Topic
 ↓
Research Plan
 ↓
Queries
 ↓
Sources
```

### Agent 2 — Analysis Agent

```text
Sources
 ↓
Facts
 ↓
Claims
 ↓
Patterns
 ↓
Content Gap
```

### Agent 3 — Content Strategist

```text
Analysis
 ↓
Opportunity
 ↓
Audience
 ↓
Angle
 ↓
Brief
 ↓
Outline
```

### Agent 4 — Writer/Reviewer

```text
Brief
+
Evidence
 ↓
Section Writer
 ↓
Fact Checker
 ↓
Final Content
```

**Không cần một Agent riêng chỉ để "viết".**

Writer + Reviewer có thể nằm trong cùng workflow LangGraph nhưng tách node rõ ràng.

---

# 14. Cái này cũng giải quyết một vấn đề lớn của dự án bạn

Bạn đang có:

> **AI Score**

> **Content Gap**

> **Business Relevance**

> **Research**

> **Content Brief**

Nếu cuối cùng AI lại viết một bài generic thì toàn bộ những thứ phía trên **mất giá trị**.

Nhưng nếu:

```text
Research
   ↓
Evidence
   ↓
Gap
   ↓
Angle
   ↓
Brief
   ↓
Evidence-grounded Writer
```

thì mỗi bước đều **đóng góp trực tiếp vào output cuối cùng**.

Đó mới là một pipeline có lý do tồn tại.

---

# 15. Và tôi sẽ sửa MVP của bạn thành thế này

```text
                    CONTENTLENS

             ┌──── AI DISCOVERY ────┐
             │                       │
             ▼                       ▼
       AI Topic                Human Topic
             │                       │
             └──────────┬────────────┘
                        ▼
                   TOPIC QUEUE
                        │
                        ▼
                 RESEARCH AGENT
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
           SOURCES              QUERIES
              │
              ▼
            ANALYSIS
              │
       ┌──────┼───────┐
       ▼      ▼       ▼
     CLAIMS   GAP   INSIGHTS
       │      │       │
       └──────┼───────┘
              ▼
        CONTENT STRATEGY
              │
              ▼
          CONTENT BRIEF
              │
              ▼
       SECTION GENERATION
              │
              ▼
         FACT CHECK
              │
              ▼
        FINAL CONTENT
              │
              ▼
          HUMAN REVIEW
```

### **Đây mới là phần tôi nghĩ bạn nên tập trung làm ngay.**

Không cần làm thêm Dashboard, không cần thêm Publishing, không cần thêm PDF.

**Nếu ContentLens có một thứ phải làm thật tốt thì đó là:**

> **“Từ một topic → research thật → hiểu khoảng trống → tạo một bài content có góc nhìn riêng và có evidence chứng minh.”**

Nếu làm được đoạn này ngon, sản phẩm của bạn đã có **core value** rồi. Còn các phần automation, notification, export... đều có thể bổ sung sau.
