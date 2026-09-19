from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.api.dependencies import get_current_user, get_openai_client
from app.core.config import Settings, get_settings
from app.core.security import AuthenticatedUser
from app.core.supabase import get_supabase_client
from app.integrations.openai_client import OpenAIClient
from app.integrations.search_provider import SearchProviderNotConfiguredError, get_search_provider
from app.integrations.source_fetcher import get_source_fetcher
from app.repositories.research import ResearchRepository
from app.repositories.topics import TopicRepository
from app.repositories.workflow_runs import WorkflowRunRepository
from app.repositories.workspaces import WorkspaceRepository
from app.schemas.common import ApiResponse
from app.schemas.topics import (
    BatchCreateTopicsRequest,
    TopicDetailResponse,
    TopicListResponse,
    TopicSummary,
)
from app.services.topics import TopicService
from app.workflows.research import ResearchWorkflow

router = APIRouter(prefix="/workspaces/{workspace_id}/topics", tags=["topics"])


def get_topic_service(
    supabase: Client = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
    ai_client: OpenAIClient = Depends(get_openai_client),
) -> TopicService:
    research_repository = ResearchRepository(supabase)
    try:
        research_workflow = ResearchWorkflow(
            research_repository=research_repository,
            search_provider=get_search_provider(settings),
            source_fetcher=get_source_fetcher(settings),
            analysis_provider=ai_client,
            source_fetch_limit=settings.research_source_fetch_limit,
        )
    except SearchProviderNotConfiguredError:
        research_workflow = None

    return TopicService(
        topic_repository=TopicRepository(supabase),
        workspace_repository=WorkspaceRepository(supabase),
        research_repository=research_repository,
        workflow_run_repository=WorkflowRunRepository(supabase),
        research_workflow=research_workflow,
    )


@router.get("", response_model=ApiResponse[TopicListResponse])
async def list_topics(
    workspace_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    topic_service: TopicService = Depends(get_topic_service),
) -> ApiResponse[TopicListResponse]:
    return ApiResponse(data=topic_service.list_topics(workspace_id, current_user.user_id))


@router.post(
    ":batch",
    response_model=ApiResponse[list[TopicSummary]],
    status_code=status.HTTP_201_CREATED,
)
async def batch_create_topics(
    workspace_id: UUID,
    request: BatchCreateTopicsRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    topic_service: TopicService = Depends(get_topic_service),
) -> ApiResponse[list[TopicSummary]]:
    return ApiResponse(
        data=topic_service.create_topics(workspace_id, current_user.user_id, request.titles)
    )


@router.get("/{topic_id}", response_model=ApiResponse[TopicDetailResponse])
async def get_topic(
    workspace_id: UUID,
    topic_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    topic_service: TopicService = Depends(get_topic_service),
) -> ApiResponse[TopicDetailResponse]:
    return ApiResponse(
        data=topic_service.get_topic_detail(workspace_id, topic_id, current_user.user_id)
    )


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    workspace_id: UUID,
    topic_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> None:
    _ = (workspace_id, topic_id, current_user)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Topic deletion is defined in the contract and will be implemented next.",
    )


@router.post("/{topic_id}/start", response_model=ApiResponse[TopicSummary])
async def start_topic(
    workspace_id: UUID,
    topic_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    topic_service: TopicService = Depends(get_topic_service),
) -> ApiResponse[TopicSummary]:
    return ApiResponse(data=topic_service.start_topic(workspace_id, topic_id, current_user.user_id))


@router.post("/{topic_id}/retry", response_model=ApiResponse[TopicSummary])
async def retry_topic(
    workspace_id: UUID,
    topic_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    topic_service: TopicService = Depends(get_topic_service),
) -> ApiResponse[TopicSummary]:
    return ApiResponse(data=topic_service.retry_topic(workspace_id, topic_id, current_user.user_id))
