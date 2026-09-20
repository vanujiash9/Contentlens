import json
from dataclasses import dataclass
from pathlib import Path

from app.prompts.loader import load_system_prompt, load_user_prompt_template

PROMPT_VERSION = "topic_discovery_v1"


@dataclass(frozen=True)
class TopicDiscoveryPromptInput:
    industry: str
    market: str
    period_days: int
    result_count: int
    search_evidence: str


PROMPT_DIR = Path(__file__).parent
SYSTEM_PROMPT = load_system_prompt(PROMPT_DIR)
USER_PROMPT_TEMPLATE = load_user_prompt_template(PROMPT_DIR)


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
    return USER_PROMPT_TEMPLATE.format(
        result_count=request.result_count,
        industry=request.industry,
        market=request.market,
        period_days=request.period_days,
        search_evidence=request.search_evidence,
        schema_hint=json.dumps(schema_hint, ensure_ascii=False),
    )


def signal_schema_hint() -> dict[str, str]:
    return {
        "score": "integer 0-100",
        "level": "high|medium|low",
        "source": "short label, e.g. AI estimate",
        "evidence": "short explanation, max 500 chars",
    }
