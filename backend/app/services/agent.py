from uuid import UUID

from app.schemas.agent import (
    AgentActionRequest,
    AgentActionResponse,
    CreateDiscoveryRunAgentAction,
    DiscoveryRunAgentResult,
    GenerateBriefAgentAction,
    GenerateBriefAgentResult,
)
from app.services.briefs import BriefService
from app.services.discovery import DiscoveryService


class ContentLensAgentService:
    def __init__(self, discovery_service: DiscoveryService, brief_service: BriefService) -> None:
        self.discovery_service = discovery_service
        self.brief_service = brief_service

    def run_action(
        self,
        workspace_id: UUID,
        current_user_id: str,
        request: AgentActionRequest,
    ) -> AgentActionResponse:
        if isinstance(request, CreateDiscoveryRunAgentAction):
            return DiscoveryRunAgentResult(
                action="create_discovery_run",
                result=self.discovery_service.create_discovery_run(
                    workspace_id,
                    current_user_id,
                    request.input,
                ),
            )

        if isinstance(request, GenerateBriefAgentAction):
            return GenerateBriefAgentResult(
                action="generate_brief",
                result=self.brief_service.generate_brief(
                    workspace_id,
                    current_user_id,
                    request.input,
                ),
            )

        raise TypeError("Unsupported agent action request")
