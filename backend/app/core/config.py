from functools import lru_cache

from pydantic import AnyHttpUrl, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ContentLens API"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:8443"])
    supabase_url: AnyHttpUrl | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwks_url: AnyHttpUrl | None = None
    supabase_jwt_audience: str = "authenticated"
    openai_api_key: SecretStr | None = Field(default=None, validation_alias="OPENAI__API_KEY")
    openai_base_url: AnyHttpUrl | None = Field(default=None, validation_alias="OPENAI__BASE_URL")
    openai_model: str | None = Field(default=None, validation_alias="OPENAI__MODEL")
    openai_timeout_seconds: int = Field(default=30, validation_alias="OPENAI__TIMEOUT_SECONDS")
    openai_max_retries: int = Field(default=2, validation_alias="OPENAI__MAX_RETRIES")
    openai_max_output_tokens: int = Field(
        default=4000,
        validation_alias="OPENAI__MAX_OUTPUT_TOKENS",
    )
    ai_discovery_enabled: bool = True
    search_provider: str | None = Field(default=None, validation_alias="SEARCH__PROVIDER")
    search_api_key: SecretStr | None = Field(default=None, validation_alias="SEARCH__API_KEY")
    search_base_url: AnyHttpUrl | None = Field(default=None, validation_alias="SEARCH__BASE_URL")
    search_result_limit: int = Field(default=10, validation_alias="SEARCH__RESULT_LIMIT")
    search_timeout_seconds: int = Field(default=20, validation_alias="SEARCH__TIMEOUT_SECONDS")
    source_fetch_timeout_seconds: int = Field(default=20, validation_alias="SOURCE_FETCH__TIMEOUT_SECONDS")
    source_fetch_max_characters: int = Field(
        default=30000,
        validation_alias="SOURCE_FETCH__MAX_CHARACTERS",
    )
    source_fetch_user_agent: str = Field(
        default="ContentLensBot/0.1 (+https://contentlens.local)",
        validation_alias="SOURCE_FETCH__USER_AGENT",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
