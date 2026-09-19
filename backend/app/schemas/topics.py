from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.research import TopicResearchAggregate

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


class TopicWorkflowStatus(BaseModel):
    id: UUID
    workflow_name: str
    status: str
    error_code: str | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    failed_at: datetime | None = None


class TopicDetailResponse(BaseModel):
    topic: TopicSummary
    research: TopicResearchAggregate
    workflow: TopicWorkflowStatus | None = None


class BatchCreateTopicsRequest(BaseModel):
    titles: list[str] = Field(min_length=1, max_length=50)


class TopicListResponse(BaseModel):
    topics: list[TopicSummary]
