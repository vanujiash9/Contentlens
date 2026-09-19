from dataclasses import dataclass
from typing import Protocol

import httpx

from app.core.config import Settings


class SearchProviderError(Exception):
    error_code = "SEARCH_PROVIDER_UNAVAILABLE"
    message = "Search provider is temporarily unavailable."


class SearchProviderNotConfiguredError(SearchProviderError):
    error_code = "SEARCH_NOT_CONFIGURED"
    message = "Search provider is not configured."


@dataclass(frozen=True)
class SearchResult:
    title: str
    url: str
    snippet: str = ""
    rank: int | None = None
    source: str | None = None


class SearchProvider(Protocol):
    def search(self, query: str, limit: int) -> list[SearchResult]:
        ...


class TavilySearchProvider:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def search(self, query: str, limit: int) -> list[SearchResult]:
        if not self._is_configured():
            raise SearchProviderNotConfiguredError

        base_url = str(self.settings.search_base_url).rstrip("/")
        payload = {
            "api_key": self.settings.search_api_key.get_secret_value(),
            "query": query,
            "max_results": limit,
            "search_depth": "advanced",
            "include_raw_content": False,
        }

        try:
            with httpx.Client(timeout=self.settings.search_timeout_seconds) as client:
                response = client.post(f"{base_url}/search", json=payload)
                response.raise_for_status()
                body = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise SearchProviderError from exc

        return parse_tavily_results(body)

    def _is_configured(self) -> bool:
        return (
            self.settings.search_provider == "tavily"
            and self.settings.search_api_key is not None
            and self.settings.search_base_url is not None
        )


def get_search_provider(settings: Settings) -> SearchProvider:
    if settings.search_provider == "tavily":
        return TavilySearchProvider(settings)
    raise SearchProviderNotConfiguredError


def parse_tavily_results(body: dict) -> list[SearchResult]:
    results = body.get("results")
    if not isinstance(results, list):
        raise SearchProviderError

    parsed: list[SearchResult] = []
    for index, item in enumerate(results, start=1):
        if not isinstance(item, dict):
            continue
        url = item.get("url")
        title = item.get("title")
        if not isinstance(url, str) or not isinstance(title, str):
            continue
        parsed.append(
            SearchResult(
                title=title.strip(),
                url=url.strip(),
                snippet=str(item.get("content") or item.get("snippet") or "").strip(),
                rank=index,
                source="tavily",
            )
        )
    return parsed
