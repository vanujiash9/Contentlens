from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.schemas.topics import PriorityLevel, TopicSummary

DiscoveryStatus = Literal["pending", "processing", "completed", "failed"]
SignalLevel = Literal["high", "medium", "low"]
PeriodDays = Literal[7, 30, 90]

MAX_DISCOVERY_TITLE_LENGTH = 240


class CreateDiscoveryRunRequest(BaseModel):
    industry: str = Field(min_length=1, max_length=120)
    market: str = Field(min_length=1, max_length=120)
    period_days: PeriodDays
    result_count: int = Field(ge=1, le=20)

    @field_validator("industry", "market")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if len(stripped) == 0:
            raise ValueError("Field cannot be empty.")
        return stripped


class SignalDetail(BaseModel):
    score: int = Field(ge=0, le=100)
    level: SignalLevel
    source: str = Field(min_length=1, max_length=80)
    evidence: str = Field(min_length=1, max_length=500)

    @field_validator("source", "evidence")
    @classmethod
    def strip_signal_text(cls, value: str) -> str:
        stripped = value.strip()
        if len(stripped) == 0:
            raise ValueError("Field cannot be empty.")
        return stripped


class DiscoveredTopicSummary(BaseModel):
    id: UUID
    title: str
    opportunity_score: int = Field(ge=0, le=100)
    priority: PriorityLevel
    search_signals: SignalDetail
    content_gap: SignalDetail
    business_relevance: SignalDetail
    angle: str | None = None
    reasoning: str | None = None
    added_to_queue_at: datetime | None = None
    topic_id: UUID | None = None
    created_at: datetime


class DiscoveryRunSummary(BaseModel):
    id: UUID
    workspace_id: UUID
    status: DiscoveryStatus
    industry: str | None = None
    market: str | None = None
    period_days: int | None = None
    result_count: int
    error_code: str | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None
    topics: list[DiscoveredTopicSummary]


class GeneratedDiscoveredTopic(BaseModel):
    title: str = Field(min_length=1, max_length=MAX_DISCOVERY_TITLE_LENGTH)
    opportunity_score: int = Field(ge=0, le=100)
    priority: PriorityLevel
    search_signals: SignalDetail
    content_gap: SignalDetail
    business_relevance: SignalDetail
    angle: str = Field(min_length=1, max_length=500)
    reasoning: str = Field(min_length=1, max_length=1000)

    @field_validator("title", "angle", "reasoning")
    @classmethod
    def strip_topic_text(cls, value: str) -> str:
        stripped = value.strip()
        if len(stripped) == 0:
            raise ValueError("Field cannot be empty.")
        return stripped


class DiscoveryGeneration(BaseModel):
    topics: list[GeneratedDiscoveredTopic] = Field(min_length=1, max_length=20)


class AddDiscoveredTopicResponse(BaseModel):
    topic: TopicSummary
