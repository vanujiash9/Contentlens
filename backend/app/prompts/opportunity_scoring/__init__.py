from pathlib import Path

from app.prompts.loader import load_system_prompt, load_user_prompt_template

PROMPT_VERSION = "opportunity_scoring_v1"

PROMPT_DIR = Path(__file__).parent
SYSTEM_PROMPT = load_system_prompt(PROMPT_DIR)
USER_PROMPT_TEMPLATE = load_user_prompt_template(PROMPT_DIR)
