from functools import lru_cache

from fastapi import HTTPException, status
from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    settings = get_settings()
    if settings.supabase_url is None or settings.supabase_service_role_key is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase backend credentials are not configured.",
        )

    return create_client(str(settings.supabase_url), settings.supabase_service_role_key)
