from pathlib import Path


def load_prompt(prompt_dir: Path, filename: str) -> str:
    return (prompt_dir / filename).read_text(encoding="utf-8").strip()


def load_system_prompt(prompt_dir: Path) -> str:
    return load_prompt(prompt_dir, "system.md")


def load_user_prompt_template(prompt_dir: Path) -> str:
    return load_prompt(prompt_dir, "user.md")
