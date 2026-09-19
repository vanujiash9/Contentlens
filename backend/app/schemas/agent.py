from typing import Annotated, Literal

from pydantic import BaseModel, Field

from app.schemas.briefs import BriefSummary, GenerateContentBriefRequest
from app.schemas.discovery import CreateDiscoveryRunRequest, DiscoveryRunSummary


class CreateDiscoveryRunAgentAction(BaseModel):
    action: Literal["create_discovery_run"]
    input: CreateDiscoveryRunRequest


class GenerateBriefAgentAction(BaseModel):
    action: Literal["generate_brief"]
    input: GenerateContentBriefRequest


AgentActionRequest = Annotated[
    CreateDiscoveryRunAgentAction | GenerateBriefAgentAction,
    Field(discriminator="action"),
]


class DiscoveryRunAgentResult(BaseModel):
    action: Literal["create_discovery_run"]
    result: DiscoveryRunSummary


class GenerateBriefAgentResult(BaseModel):
    action: Literal["generate_brief"]
    result: BriefSummary


AgentActionResponse = DiscoveryRunAgentResult | GenerateBriefAgentResult
