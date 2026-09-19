from app.prompts import content_brief
from app.schemas.briefs import ContentBriefGeneration


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


def test_content_brief_user_prompt_builds_with_schema_hint() -> None:
    prompt = content_brief.build_user_prompt(
        content_brief.ContentBriefPromptInput(
            topic="Yamaha U3 buyer guide",
            industry="Piano & nhạc cụ phím",
            market="Việt Nam",
            audience="Người mua piano gia đình",
            search_intent="Mua Yamaha U3 cũ",
            angle="Checklist mua đàn",
            business_goal="Tăng lead tư vấn",
            research_insights="Người mua lo về chất lượng đàn cũ.",
        ),
        ContentBriefGeneration,
    )

    assert "Yamaha U3 buyer guide" in prompt
    assert "ContentBriefGeneration" in prompt
    assert "key_questions" in prompt
