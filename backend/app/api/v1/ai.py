from fastapi import APIRouter, Depends

from app.ai.router import AIError, AIInvalidResponseError, AIRouter, TopicDiscoveryInput
from app.ai.topic_discovery import (
    TopicDiscoveryError,
    TopicDiscoveryInvalidResponseError,
    raise_discovery_http_error,
)
from app.api.dependencies import get_ai_router
from app.schemas.ai import TopicDiscoveryAIRequest, TopicDiscoveryAIResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post(
    "/topic-discovery:test",
    response_model=ApiResponse[TopicDiscoveryAIResponse],
)
async def test_topic_discovery(
    request: TopicDiscoveryAIRequest,
    ai_router: AIRouter = Depends(get_ai_router),
) -> ApiResponse[TopicDiscoveryAIResponse]:
    try:
        result = ai_router.run_topic_discovery(
            TopicDiscoveryInput(
                industry=request.industry,
                market=request.market,
                period_days=request.period_days,
                result_count=request.result_count,
            )
        )
    except AIInvalidResponseError:
        raise_discovery_http_error(TopicDiscoveryInvalidResponseError())
    except AIError:
        raise_discovery_http_error(TopicDiscoveryError())

    return ApiResponse(data=result)
