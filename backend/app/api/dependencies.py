from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from supabase import Client

from app.ai.router import AIRouter
from app.ai.topic_discovery import OpenAITopicDiscoveryGenerator
from app.core.config import Settings, get_settings
from app.core.security import AuthenticatedUser, verify_supabase_token
from app.core.supabase import get_supabase_client
from app.integrations.openai_client import OpenAIClient
from app.repositories.discovery import DiscoveryRepository
from app.repositories.topics import TopicRepository
from app.repositories.workspaces import WorkspaceRepository
from app.services.discovery import DiscoveryService


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    return await verify_supabase_token(authorization.removeprefix("Bearer ").strip(), settings)


def get_openai_client(settings: Settings = Depends(get_settings)) -> OpenAIClient:
    return OpenAIClient(settings)


def get_ai_router(client: OpenAIClient = Depends(get_openai_client)) -> AIRouter:
    return AIRouter(client)


def get_topic_discovery_generator(
    ai_router: AIRouter = Depends(get_ai_router),
) -> OpenAITopicDiscoveryGenerator:
    return OpenAITopicDiscoveryGenerator(ai_router)


def get_discovery_service(
    supabase: Client = Depends(get_supabase_client),
    generator: OpenAITopicDiscoveryGenerator = Depends(get_topic_discovery_generator),
) -> DiscoveryService:
    return DiscoveryService(
        discovery_repository=DiscoveryRepository(supabase),
        topic_repository=TopicRepository(supabase),
        workspace_repository=WorkspaceRepository(supabase),
        generator=generator,
    )
