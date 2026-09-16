from app.prompts import content_brief


def test_content_brief_system_prompt_loads_from_markdown() -> None:
    assert "ContentLens Content Brief AI" in content_brief.SYSTEM_PROMPT
    assert "Return only valid JSON" in content_brief.SYSTEM_PROMPT
    assert "write all user-facing fields in Vietnamese" in content_brief.SYSTEM_PROMPT


def test_content_brief_user_prompt_template_includes_expected_placeholders() -> None:
    template = content_brief.USER_PROMPT_TEMPLATE

    assert "{topic}" in template
    assert "{industry}" in template
    assert "{market}" in template
    assert "{audience}" in template
    assert "{search_intent}" in template
    assert "{angle}" in template
    assert "{business_goal}" in template
    assert "{research_insights}" in template
    assert "{schema_hint}" in template


def test_content_brief_prompt_version_remains_stable() -> None:
    assert content_brief.PROMPT_VERSION == "content_brief_v1"
