from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


SourceStatus = Literal["pending", "fetched", "failed"]


class ResearchPlan(BaseModel):
    objective: str = Field(min_length=1, max_length=1000)
    target_keyword: str = Field(min_length=1, max_length=240)
    search_intent: str = Field(min_length=1, max_length=500)
    audience: str = Field(min_length=1, max_length=500)
    notes: list[str] = Field(default_factory=list, max_length=20)


class SearchQuerySummary(BaseModel):
    id: UUID
    query: str
    result_count: int = 0
    created_at: datetime


class ResearchSourceSummary(BaseModel):
    id: UUID
    query_id: UUID | None = None
    title: str
    url: str
    domain: str | None = None
    rank: int | None = None
    snippet: str | None = None
    status: SourceStatus
    extracted_text: str | None = None
    error_message: str | None = None
    created_at: datetime
    fetched_at: datetime | None = None


class ResearchFindingSummary(BaseModel):
    id: UUID
    claim: str
    finding_type: str
    source_ids: list[UUID] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class InformationGapSummary(BaseModel):
    id: UUID
    description: str
    recommendation: str | None = None
    created_at: datetime


class OpportunitySummary(BaseModel):
    score: int = Field(ge=0, le=100)
    priority: Literal["high", "medium", "low"]
    recommendation: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class TopicResearchAggregate(BaseModel):
    plan: ResearchPlan | None = None
    queries: list[SearchQuerySummary] = Field(default_factory=list)
    sources: list[ResearchSourceSummary] = Field(default_factory=list)
    findings: list[ResearchFindingSummary] = Field(default_factory=list)
    information_gaps: list[InformationGapSummary] = Field(default_factory=list)
    opportunity: OpportunitySummary | None = None


class GeneratedResearchFinding(BaseModel):
    claim: str = Field(min_length=1, max_length=700)
    finding_type: str = Field(min_length=1, max_length=80)
    source_urls: list[str] = Field(default_factory=list, max_length=10)


class GeneratedInformationGap(BaseModel):
    description: str = Field(min_length=1, max_length=700)
    recommendation: str | None = Field(default=None, max_length=700)


class ResearchOpportunityAnalysis(BaseModel):
    score: int = Field(ge=0, le=100)
    priority: Literal["high", "medium", "low"]
    recommendation: str = Field(min_length=1, max_length=1000)
    angle: str = Field(min_length=1, max_length=700)
    audience: str = Field(min_length=1, max_length=500)
    reasons: list[str] = Field(default_factory=list, max_length=8)


class ResearchAnalysisGeneration(BaseModel):
    findings: list[GeneratedResearchFinding] = Field(min_length=1, max_length=10)
    information_gaps: list[GeneratedInformationGap] = Field(default_factory=list, max_length=10)
    opportunity: ResearchOpportunityAnalysis
    warnings: list[str] = Field(default_factory=list, max_length=8)
