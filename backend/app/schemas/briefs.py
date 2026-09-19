from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, ValidationInfo, field_validator


class GenerateContentBriefRequest(BaseModel):
    topic_id: UUID
    industry: str = Field(min_length=1, max_length=120)
    market: str = Field(min_length=1, max_length=120)
    audience: str = Field(min_length=1, max_length=240)
    search_intent: str = Field(min_length=1, max_length=240)
    angle: str = Field(min_length=1, max_length=500)
    business_goal: str = Field(min_length=1, max_length=500)
    research_insights: str = Field(default="", max_length=4000)

    @field_validator(
        "industry",
        "market",
        "audience",
        "search_intent",
        "angle",
        "business_goal",
        "research_insights",
    )
    @classmethod
    def strip_text(cls, value: str, info: ValidationInfo) -> str:
        stripped = value.strip()
        if info.field_name != "research_insights" and len(stripped) == 0:
            raise ValueError("Field cannot be empty.")
        return stripped


class ContentBriefGeneration(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    search_intent: str = Field(min_length=1, max_length=500)
    target_audience: str = Field(min_length=1, max_length=500)
    objective: str = Field(min_length=1, max_length=500)
    angle: str = Field(min_length=1, max_length=500)
    key_questions: list[str] = Field(min_length=1, max_length=12)
    outline: list[dict[str, Any]] = Field(min_length=1, max_length=20)
    key_facts: list[str] = Field(default_factory=list, max_length=20)
    must_cover: list[str] = Field(default_factory=list, max_length=20)
    must_avoid: list[str] = Field(default_factory=list, max_length=20)
    evidence_map: list[dict[str, Any]] = Field(default_factory=list, max_length=30)
    quality_checks: list[str] = Field(default_factory=list, max_length=20)
    quality_warnings: list[str] = Field(default_factory=list, max_length=20)

    @field_validator(
        "title",
        "search_intent",
        "target_audience",
        "objective",
        "angle",
    )
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if len(stripped) == 0:
            raise ValueError("Field cannot be empty.")
        return stripped


class BriefSummary(BaseModel):
    id: UUID
    workspace_id: UUID
    topic_id: UUID
    title: str
    search_intent: str | None = None
    target_audience: str | None = None
    objective: str | None = None
    angle: str | None = None
    key_questions: list[Any]
    outline: list[Any]
    key_facts: list[Any]
    must_cover: list[Any]
    must_avoid: list[Any]
    evidence_map: list[Any]
    review_status: str
    quality_checks: list[Any]
    quality_warnings: list[Any]
    created_at: datetime
    updated_at: datetime
    version: int


class BriefListResponse(BaseModel):
    briefs: list[BriefSummary]
