from app.prompts import brief_revision
from app.schemas.briefs import ContentBriefGeneration


def test_brief_revision_system_prompt_loads_from_markdown() -> None:
    assert "ContentLens brief revision AI" in brief_revision.SYSTEM_PROMPT
    assert "Return only valid JSON" in brief_revision.SYSTEM_PROMPT
    assert "Do not invent sources" in brief_revision.SYSTEM_PROMPT


def test_brief_revision_user_prompt_template_includes_expected_placeholders() -> None:
    template = brief_revision.USER_PROMPT_TEMPLATE

    assert "{revision_request}" in template
    assert "{current_brief}" in template
    assert "{schema_hint}" in template


def test_brief_revision_prompt_version_remains_stable() -> None:
    assert brief_revision.PROMPT_VERSION == "brief_revision_v1"


def test_brief_revision_user_prompt_builds_with_schema_hint() -> None:
    prompt = brief_revision.build_user_prompt(
        brief_revision.BriefRevisionPromptInput(
            revision_request="Viết lại phần kết luận.",
            current_brief={"title": "Hướng dẫn mua Yamaha U3", "draft": "Bản nháp"},
        ),
        ContentBriefGeneration,
    )

    assert "Viết lại phần kết luận" in prompt
    assert "Hướng dẫn mua Yamaha U3" in prompt
    assert "ContentBriefGeneration" in prompt
    assert "quality_warnings" in prompt
