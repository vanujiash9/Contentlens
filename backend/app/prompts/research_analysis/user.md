Analyze the fetched competitor article evidence for this topic.

Context:
- Topic: {topic}
- Industry: {industry}
- Market: {market}
- Competitor sources: {sources}

Produce:
- concise source-backed findings about what top/current articles commonly cover
- information gaps competitors are not covering well
- an opportunity score and priority
- recommendation for a stronger content angle designed to compete in Google organic results, AI Overview answers, and recommendation surfaces
- warnings if evidence is weak
- structured competitor analysis for each fetched article
- structured cross-SERP analysis across all competitors

For each competitor, analyze:
- search intent served by the article
- main angle
- strengths
- weaknesses
- content depth
- unique value
- topics and subtopics covered
- questions answered
- entities explicitly present in the evidence
- examples explicitly present in the evidence
- tables/images/video evidence from the extracted metadata

For cross-SERP analysis, synthesize:
- common patterns across competitors
- must-cover topics for a better article
- content gaps competitors miss or cover weakly
- weak explanations that need clearer/deeper treatment
- unanswered questions the better article should answer
- differentiation opportunities
- information-gain opportunities that add new utility instead of rewording competitors

Your analysis must cover:
- search intent: what the reader is probably trying to decide or learn
- competitor formula: recurring title/structure/claims across the provided sources
- content gaps: missing proof, missing local market context, missing comparison criteria, missing FAQs, or weak practical guidance
- better-article angle: how our draft should be more useful, specific, and source-grounded than the current results
- citation discipline: only reference evidence found in the provided sources

Return exactly this JSON shape with no extra text:
{schema_hint}
