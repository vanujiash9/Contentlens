import json
from dataclasses import dataclass
from pathlib import Path

from pydantic import BaseModel

from app.prompts.loader import load_system_prompt, load_user_prompt_template

PROMPT_VERSION = "content_brief_v1"

PROMPT_DIR = Path(__file__).parent
SYSTEM_PROMPT = load_system_prompt(PROMPT_DIR)
USER_PROMPT_TEMPLATE = load_user_prompt_template(PROMPT_DIR)


@dataclass(frozen=True)
class ContentBriefPromptInput:
    topic: str
    industry: str
    market: str
    audience: str
    search_intent: str
    angle: str
    business_goal: str
    research_insights: str


def build_user_prompt(prompt_input: ContentBriefPromptInput, output_model: type[BaseModel]) -> str:
    return USER_PROMPT_TEMPLATE.format(
        topic=prompt_input.topic,
        industry=prompt_input.industry,
        market=prompt_input.market,
        audience=prompt_input.audience,
        search_intent=prompt_input.search_intent,
        angle=prompt_input.angle,
        business_goal=prompt_input.business_goal,
        research_insights=prompt_input.research_insights or "Unavailable",
        schema_hint=json.dumps(output_model.model_json_schema(), ensure_ascii=False),
    )
