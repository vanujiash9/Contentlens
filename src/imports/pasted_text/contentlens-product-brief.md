Design a web application called "ContentLens".

ContentLens is an AI-powered content research and planning platform for a piano business.

The main purpose of this website is NOT to publish articles automatically.

The purpose is to help a human content/marketing user decide:

"What topics are worth writing about, what do existing sources say, what information is missing, and what should we create content about?"

The user should be able to enter multiple topics and let AI research them systematically.

CORE BUSINESS PROBLEM

A content team may have many possible topics but researching each topic manually takes a lot of time.

For each topic, a human normally needs to:

- Search Google multiple times
- Read many websites
- Compare information
- Identify useful facts
- Understand user intent
- Find what existing articles are missing
- Decide whether the topic is worth writing
- Decide what angle the article should take
- Create an outline before writing

ContentLens automates most of this research work.

The human remains in control and makes the final decision.

CORE PRODUCT VALUE

ContentLens turns:

Topic
→ Research
→ Sources
→ Insights
→ Information Gaps
→ Content Opportunity
→ Content Brief
→ Draft

into one connected workflow.

The product should make this process easy to understand and easy to review.

USER WORKFLOW

The primary user journey is:

1. User enters one or multiple topics.

Example:

"Yamaha U3"
"Kawai K300"
"Yamaha U1 vs Yamaha U3"
"Best piano for beginners"

2. Topics are placed into a research queue.

3. User starts research for a topic.

4. AI creates a research plan.

5. AI generates relevant search queries.

6. AI searches the web and collects useful sources.

7. AI analyzes information across sources.

8. AI identifies key findings and conflicting information.

9. AI identifies information gaps in existing content.

10. AI evaluates whether the topic is a good content opportunity.

11. AI recommends a content angle.

12. AI generates a content brief and optionally a draft.

13. Human reviews the result.

14. The final output is the research result and content brief/draft.

The workflow ends here.

There is NO automatic publishing.

IMPORTANT PRODUCT PRINCIPLE

The user should feel like they are managing and reviewing an AI research process, not operating a complicated collection of AI agents.

Do not expose technical AI concepts such as:

- LangGraph nodes
- prompts
- tokens
- temperature
- model parameters
- agent internals

in the main interface.

Instead, present AI work in simple business language:

"Researching topic"
"Analyzing sources"
"Finding content gaps"
"Evaluating opportunity"
"Preparing content brief"

PRIMARY USER GOALS

The interface should help the user answer five questions quickly:

1. What topics are currently being researched?

2. What did the AI find?

3. Which sources support the findings?

4. Is this topic worth creating content about?

5. What content should we create?

The interface should prioritize these questions over technical AI information.

KEY INFORMATION TO SHOW

For every researched topic, the user should be able to see:

TOPIC
What are we researching?

RESEARCH STATUS
Is it pending, researching, completed, or failed?

RESEARCH PLAN
What questions is the AI trying to answer?

SEARCH QUERIES
What did the AI search for?

SOURCES
Which websites were used?

KEY FINDINGS
What important information was discovered?

INFORMATION GAPS
What information is missing or poorly covered by existing content?

CONTENT OPPORTUNITY
How valuable is this topic and why?

CONTENT ANGLE
What is the recommended way to approach the topic?

CONTENT BRIEF
What should the final article contain?

CONTENT DRAFT
What could the resulting article look like?

UI PRIORITY

The most important screens are:

1. Topic Queue
2. Research Progress
3. Research Results
4. Sources
5. Analysis
6. Information Gaps
7. Content Opportunity
8. Content Brief / Draft

The dashboard is secondary.

The actual research result is more important than analytics.

DESIGN THE UI AROUND THE WORKFLOW

The interface should naturally guide the user from:

"What should we research?"

to:

"What did we learn?"

to:

"Is it worth writing?"

to:

"What should we create?"

Avoid making the product look like a generic analytics dashboard.

It should feel like a focused research workspace.

DESIGN STYLE

Use a clean, professional SaaS interface.

The visual style should be:

- Minimal
- Calm
- Professional
- Modern
- Information-focused
- Easy to scan
- Not overly colorful
- Not futuristic/cyberpunk
- Not flashy

Use mostly neutral colors with one restrained primary accent color.

Use cards, tables, tabs, badges, progress indicators and readable content sections.

Avoid:

- Neon gradients
- Excessive purple/pink gradients
- Glassmorphism everywhere
- Excessive animations
- Huge illustrations
- Decorative AI graphics
- Excessive rounded cards
- Too many charts

The product should look like a serious internal tool used by a content team.

RESPONSIVE DESIGN

Design both desktop and mobile layouts.

Desktop:

- Sidebar navigation
- Main workspace
- Optional right-side contextual panel
- Comfortable content width
- Tables where appropriate

Mobile:

- Collapsible navigation
- Single-column layout
- Cards instead of dense tables where necessary
- Horizontally scrollable tables only when appropriate
- Readable typography
- Comfortable touch targets
- No horizontal overflow

The desktop and mobile versions should feel like the same product, not two unrelated designs.

TYPOGRAPHY

Use Inter or a similar modern sans-serif font.

Keep typography consistent.

Suggested sizes:

Page title: 24px desktop / 20px mobile
Section title: 18px / 16px
Body: 14px
Secondary text: 13px
Caption: 12px
Buttons: 14px

Do not use many different font sizes.

DESIGN THE FOLLOWING MAIN SCREENS

1. Overview Dashboard

Show:
- Topics requiring attention
- Researching topics
- Completed research
- High-opportunity topics
- Recent topics
- Recent research activity

2. Topic Queue

This is one of the most important screens.

The user should be able to:
- Add multiple topics
- Search topics
- Filter by status
- See research progress
- Start research
- Retry failed research
- Open topic details

3. Topic Detail / Research Workspace

This is the central workspace.

Show the selected topic and its entire research journey.

Use tabs or a clear step navigation:

Overview
Research Plan
Queries
Sources
Analysis
Information Gaps
Opportunity
Content Brief

4. Research Progress

Clearly show what AI is currently doing.

Example:

Research Planning ✓
Query Generation ✓
Searching ✓
Source Collection ✓
Source Analysis →
Information Gap
Opportunity
Content Brief

The user should always understand whether the process is working, waiting, completed or failed.

5. Sources

Show the collected sources clearly.

For each source show:
- Website
- Title
- URL
- Relevance
- Source type
- Key contribution

6. Analysis

Show:
- Research summary
- Key findings
- Source comparison
- Conflicting information
- Supporting sources

7. Information Gaps

Clearly explain:
"What do existing sources fail to answer well?"

Show:
- Gap
- Evidence
- Importance
- Related sources

8. Content Opportunity

This is a key decision screen.

The user should immediately understand:

"Should I write this topic?"

Show:
- Opportunity score
- Priority
- Search intent
- Content gap
- Topic relevance
- Business relevance
- Recommended content angle
- Reasons

9. Content Brief

Show the final recommendation:

- Title
- Search intent
- Target audience
- Content objective
- Recommended angle
- Key questions
- Outline
- Key facts
- Supporting sources

10. Content Draft

Show the generated draft in a readable editorial interface.

Allow:
- Edit
- Regenerate section
- Copy
- Save Draft

Do NOT include:
- Publish
- WordPress
- Social Media
- IndexNow

FINAL UX PRINCIPLE

The most important action in the product is not "Generate".

The most important action is:

"Understand the research and decide what content is worth creating."

AI does the heavy research work.

The human reviews, evaluates and decides.

Design the interface around this human + AI collaboration model.