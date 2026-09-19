Revise the existing content brief according to the revision request.

Revision request:
{revision_request}

Current brief JSON:
{current_brief}

Rules:
- Return a complete replacement brief, not a partial patch.
- Preserve accurate fields that are not affected by the request.
- Do not invent sources, statistics, URLs, or citations.
- If requested changes require missing evidence, add that limitation to quality_warnings.
- Keep user-facing fields in the target market language.

Return exactly this JSON shape with no extra text:
{schema_hint}
