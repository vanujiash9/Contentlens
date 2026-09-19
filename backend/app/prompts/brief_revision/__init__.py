import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from app.prompts.loader import load_system_prompt, load_user_prompt_template

PROMPT_VERSION = "brief_revision_v1"

PROMPT_DIR = Path(__file__).parent
SYSTEM_PROMPT = load_system_prompt(PROMPT_DIR)
USER_PROMPT_TEMPLATE = load_user_prompt_template(PROMPT_DIR)


@dataclass(frozen=True)
class BriefRevisionPromptInput:
    revision_request: str
    current_brief: dict[str, Any]


def build_user_prompt(prompt_input: BriefRevisionPromptInput, output_model: type[BaseModel]) -> str:
    return USER_PROMPT_TEMPLATE.format(
        revision_request=prompt_input.revision_request,
        current_brief=json.dumps(prompt_input.current_brief, ensure_ascii=False),
        schema_hint=json.dumps(output_model.model_json_schema(), ensure_ascii=False),
    )
