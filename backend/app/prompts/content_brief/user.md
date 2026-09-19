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

Draft requirements:
- Fill the draft field with a complete article draft that a writer can revise directly.
- The draft must include a working headline, introduction, body sections, practical recommendations, and conclusion/CTA.
- Use citations only for sources present in the research insights. Do not invent URLs, statistics, quotes, or source-backed claims.
- If research insights are unavailable or too thin, still provide the best draft possible from the supplied context, but add quality_warnings that name the evidence limitations.

If any context field is empty or unavailable, include that gap in quality_warnings or open questions instead of inventing facts.

Return exactly this JSON shape with no extra text:
{schema_hint}
