from pydantic import BaseModel

from app.schemas.discovery import CreateDiscoveryRunRequest, DiscoveryGeneration


class AIProviderMetadata(BaseModel):
    provider: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None
    prompt_version: str


class TopicDiscoveryAIRequest(CreateDiscoveryRunRequest):
    pass


class TopicDiscoveryAIResponse(BaseModel):
    generation: DiscoveryGeneration
    metadata: AIProviderMetadata
