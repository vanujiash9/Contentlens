from dataclasses import dataclass
from pathlib import Path

from pydantic import BaseModel

PROMPT_VERSION = "research-analysis-v1"
_BASE_DIR = Path(__file__).parent
SYSTEM_PROMPT = (_BASE_DIR / "system.md").read_text(encoding="utf-8")
USER_TEMPLATE = (_BASE_DIR / "user.md").read_text(encoding="utf-8")


@dataclass(frozen=True)
class ResearchAnalysisPromptInput:
    topic: str
    industry: str
    market: str
    sources: str


def build_user_prompt(
    prompt_input: ResearchAnalysisPromptInput,
    output_model: type[BaseModel],
) -> str:
    return USER_TEMPLATE.format(
        topic=prompt_input.topic,
        industry=prompt_input.industry,
        market=prompt_input.market,
        sources=prompt_input.sources,
        schema_hint=output_model.model_json_schema(),
    )
