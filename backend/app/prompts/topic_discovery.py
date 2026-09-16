import json
from dataclasses import dataclass

PROMPT_VERSION = "topic_discovery_v1"


@dataclass(frozen=True)
class TopicDiscoveryPromptInput:
    industry: str
    market: str
    period_days: int
    result_count: int


SYSTEM_PROMPT = (
    "You are ContentLens topic discovery. Return only valid JSON, no markdown. "
    "Your scores are AI estimates, not live search-volume data. "
    "Do not include URLs or citations unless provided by the user."
)


def build_user_prompt(request: TopicDiscoveryPromptInput) -> str:
    schema_hint = {
        "topics": [
            {
                "title": "string, max 240 chars",
                "opportunity_score": "integer 0-100",
                "priority": "high|medium|low",
                "search_signals": signal_schema_hint(),
                "content_gap": signal_schema_hint(),
                "business_relevance": signal_schema_hint(),
                "angle": "string, max 500 chars",
                "reasoning": "string, max 1000 chars",
            }
        ]
    }
    return (
        f"Generate {request.result_count} topic ideas for the industry '{request.industry}' "
        f"in market '{request.market}' over the last {request.period_days} days. "
        "Favor practical content opportunities for an internal content research workflow. "
        "Return exactly this JSON shape with no extra text:\n"
        f"{json.dumps(schema_hint, ensure_ascii=False)}"
    )


def signal_schema_hint() -> dict[str, str]:
    return {
        "score": "integer 0-100",
        "level": "high|medium|low",
        "source": "short label, e.g. AI estimate",
        "evidence": "short explanation, max 500 chars",
    }
