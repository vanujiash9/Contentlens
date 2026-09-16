from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

TopicStatus = Literal["pending", "processing", "completed", "failed"]
PriorityLevel = Literal["high", "medium", "low"]
TopicSource = Literal["user", "ai"]


class TopicSummary(BaseModel):
    id: UUID
    title: str
    status: TopicStatus
    source: TopicSource
    opportunity_score: int | None = None
    priority: PriorityLevel | None = None
    research_progress: int
    current_step: str | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None
    version: int


class BatchCreateTopicsRequest(BaseModel):
    titles: list[str] = Field(min_length=1, max_length=50)


class TopicListResponse(BaseModel):
    topics: list[TopicSummary]
