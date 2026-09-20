Create a content brief for the selected topic "{topic}".

Context:
- Industry: {industry}
- Target market: {market}
- Target audience: {audience}
- Search intent: {search_intent}
- Editorial angle: {angle}
- Business goal: {business_goal}
- Research insights: {research_insights}

The brief should help a content team understand what to write, why it matters, what to cover, and how the content should support the business goal.

Use structured research first:
- If research_insights includes opportunity.metadata.competitor_analysis, use it to understand each competitor's intent, angle, strengths, weaknesses, depth, topics, questions, entities, examples, and media/table evidence.
- If research_insights includes opportunity.metadata.cross_serp_analysis, use its common_patterns, must_cover_topics, content_gaps, weak_explanations, unanswered_questions, differentiation_opportunities, and information_gain_opportunities as the backbone of the brief.
- Derive must_cover from must-cover topics and common patterns.
- Put unanswered questions into key_questions where relevant.
- Turn weak explanations and content gaps into clearer/deeper outline sections.
- Turn differentiation and information-gain opportunities into the editorial angle, practical recommendations, and draft sections.
- Use source URLs only when they are present in research insights. Do not invent URLs, statistics, quotes, entities, examples, or source-backed claims.

Draft requirements:
- Fill the draft field with a complete article draft that a writer can revise directly.
- The draft must include a working headline, introduction, body sections, practical recommendations, and conclusion/CTA.
- Use citations only for sources present in the research insights. Do not invent URLs, statistics, quotes, or source-backed claims.
- If research insights are unavailable or too thin, still provide the best draft possible from the supplied context, but add quality_warnings that name the evidence limitations.

If any context field is empty or unavailable, include that gap in quality_warnings or open questions instead of inventing facts.

Return exactly this JSON shape with no extra text:
{schema_hint}
