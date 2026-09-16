import json

from app.prompts import topic_discovery


def make_prompt_input() -> topic_discovery.TopicDiscoveryPromptInput:
    return topic_discovery.TopicDiscoveryPromptInput(
        industry="Piano & nhạc cụ phím",
        market="Việt Nam",
        period_days=30,
        result_count=2,
    )


def test_system_prompt_loads_from_markdown() -> None:
    assert "ContentLens Topic Discovery AI" in topic_discovery.SYSTEM_PROMPT
    assert "Return only valid JSON" in topic_discovery.SYSTEM_PROMPT
    assert "write all user-facing fields in Vietnamese" in topic_discovery.SYSTEM_PROMPT


def test_prompt_version_remains_stable() -> None:
    assert topic_discovery.PROMPT_VERSION == "topic_discovery_v1"


def test_build_user_prompt_includes_request_values() -> None:
    user_prompt = topic_discovery.build_user_prompt(make_prompt_input())

    assert "Generate 2 content opportunity topic ideas" in user_prompt
    assert "Piano & nhạc cụ phím" in user_prompt
    assert "Việt Nam" in user_prompt
    assert "last 30 days" in user_prompt


def test_build_user_prompt_includes_valid_schema_hint() -> None:
    user_prompt = topic_discovery.build_user_prompt(make_prompt_input())
    schema_text = user_prompt.split("Return exactly this JSON shape with no extra text:\n", 1)[1]

    schema_hint = json.loads(schema_text)
    topic_hint = schema_hint["topics"][0]

    assert topic_hint["opportunity_score"] == "integer 0-100"
    assert topic_hint["search_signals"]["score"] == "integer 0-100"
    assert topic_hint["content_gap"]["level"] == "high|medium|low"
    assert topic_hint["business_relevance"]["evidence"] == "short explanation, max 500 chars"
    assert topic_hint["angle"] == "string, max 500 chars"
    assert topic_hint["reasoning"] == "string, max 1000 chars"
