from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Protocol
from urllib.parse import urlparse

import httpx

from app.core.config import Settings


class SourceFetchError(Exception):
    error_code = "SOURCE_FETCH_UNAVAILABLE"
    message = "Source content is temporarily unavailable."


@dataclass(frozen=True)
class FetchedSource:
    url: str
    title: str
    domain: str
    text: str
    status_code: int


class SourceFetcher(Protocol):
    def fetch(self, url: str) -> FetchedSource:
        ...


class HttpSourceFetcher:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def fetch(self, url: str) -> FetchedSource:
        try:
            with httpx.Client(
                timeout=self.settings.source_fetch_timeout_seconds,
                follow_redirects=True,
                headers={"User-Agent": self.settings.source_fetch_user_agent},
            ) as client:
                response = client.get(url)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise SourceFetchError from exc

        parser = ReadableHtmlParser()
        parser.feed(response.text)
        return FetchedSource(
            url=str(response.url),
            title=parser.title.strip(),
            domain=urlparse(str(response.url)).netloc,
            text=parser.readable_text[: self.settings.source_fetch_max_characters].strip(),
            status_code=response.status_code,
        )


def get_source_fetcher(settings: Settings) -> SourceFetcher:
    return HttpSourceFetcher(settings)


class ReadableHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title = ""
        self._title_parts: list[str] = []
        self._text_parts: list[str] = []
        self._ignored_tags: list[str] = []
        self._is_title = False

    @property
    def readable_text(self) -> str:
        return "\n".join(part for part in self._text_parts if part)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        _ = attrs
        if tag in {"script", "style", "noscript", "svg"}:
            self._ignored_tags.append(tag)
        if tag == "title":
            self._is_title = True

    def handle_endtag(self, tag: str) -> None:
        if self._ignored_tags and self._ignored_tags[-1] == tag:
            self._ignored_tags = self._ignored_tags[:-1]
        if tag == "title":
            self._is_title = False
            self.title = " ".join(self._title_parts)

    def handle_data(self, data: str) -> None:
        text = " ".join(data.split())
        if not text:
            return
        if self._is_title:
            self._title_parts.append(text)
        if not self._ignored_tags:
            self._text_parts.append(text)
