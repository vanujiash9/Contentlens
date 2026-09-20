from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Protocol
from urllib.parse import urlparse

import httpx

from app.core.config import Settings

IGNORED_TAGS = {"script", "style", "noscript", "svg"}
HEADING_TAGS = {"h1", "h2", "h3"}
QUESTION_LIMIT = 20
EXAMPLE_LIMIT = 12
EXAMPLE_MARKERS = ("ví dụ", "chẳng hạn", "example", "case study")


class SourceFetchError(Exception):
    error_code = "SOURCE_FETCH_UNAVAILABLE"
    message = "Source content is temporarily unavailable."


@dataclass(frozen=True)
class SourceHeading:
    level: str
    text: str


@dataclass(frozen=True)
class FetchedSource:
    url: str
    title: str
    domain: str
    text: str
    status_code: int
    headings: list[SourceHeading]
    word_count: int
    questions: list[str]
    examples: list[str]
    tables_count: int
    images_count: int
    videos_count: int


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
        text = parser.readable_text[: self.settings.source_fetch_max_characters].strip()
        headings = parser.headings
        return FetchedSource(
            url=str(response.url),
            title=parser.title.strip(),
            domain=urlparse(str(response.url)).netloc,
            text=text,
            status_code=response.status_code,
            headings=headings,
            word_count=count_words(text),
            questions=extract_questions(headings, text),
            examples=extract_examples(text),
            tables_count=parser.tables_count,
            images_count=parser.images_count,
            videos_count=parser.videos_count,
        )


def get_source_fetcher(settings: Settings) -> SourceFetcher:
    return HttpSourceFetcher(settings)


class ReadableHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title = ""
        self.headings: list[SourceHeading] = []
        self.tables_count = 0
        self.images_count = 0
        self.videos_count = 0
        self._title_parts: list[str] = []
        self._heading_parts: list[str] = []
        self._text_parts: list[str] = []
        self._ignored_tags: list[str] = []
        self._is_title = False
        self._current_heading_tag: str | None = None

    @property
    def readable_text(self) -> str:
        return "\n".join(part for part in self._text_parts if part)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        _ = attrs
        normalized_tag = tag.lower()
        if normalized_tag in IGNORED_TAGS:
            self._ignored_tags.append(normalized_tag)
        if normalized_tag == "title":
            self._is_title = True
        if normalized_tag in HEADING_TAGS and not self._ignored_tags:
            self._current_heading_tag = normalized_tag
            self._heading_parts = []
        if normalized_tag == "table" and not self._ignored_tags:
            self.tables_count += 1
        if normalized_tag == "img" and not self._ignored_tags:
            self.images_count += 1
        if normalized_tag in {"video", "iframe", "embed"} and not self._ignored_tags:
            self.videos_count += 1

    def handle_endtag(self, tag: str) -> None:
        normalized_tag = tag.lower()
        if self._ignored_tags and self._ignored_tags[-1] == normalized_tag:
            self._ignored_tags = self._ignored_tags[:-1]
        if normalized_tag == "title":
            self._is_title = False
            self.title = " ".join(self._title_parts)
        if normalized_tag == self._current_heading_tag:
            heading_text = " ".join(self._heading_parts).strip()
            if heading_text:
                self.headings.append(
                    SourceHeading(level=normalized_tag, text=heading_text)
                )
            self._heading_parts = []
            self._current_heading_tag = None

    def handle_data(self, data: str) -> None:
        text = " ".join(data.split())
        if not text:
            return
        if self._is_title:
            self._title_parts.append(text)
        if self._current_heading_tag is not None and not self._ignored_tags:
            self._heading_parts.append(text)
        if not self._ignored_tags:
            self._text_parts.append(text)


def count_words(text: str) -> int:
    return len([word for word in text.split() if word.strip()])


def extract_questions(headings: list[SourceHeading], text: str) -> list[str]:
    candidates = [heading.text for heading in headings if heading.text.endswith("?")]
    candidates.extend(
        line.strip() for line in text.split("\n") if line.strip().endswith("?")
    )
    questions = []
    seen = set()
    for candidate in candidates:
        question = candidate if candidate.endswith("?") else f"{candidate}?"
        normalized = question.casefold()
        if normalized not in seen:
            seen.add(normalized)
            questions.append(question)
        if len(questions) >= QUESTION_LIMIT:
            break
    return questions


def extract_examples(text: str) -> list[str]:
    examples = []
    seen = set()
    for line in text.split("\n"):
        normalized_line = line.strip()
        lowered = normalized_line.casefold()
        if not normalized_line or not any(marker in lowered for marker in EXAMPLE_MARKERS):
            continue
        if lowered in seen:
            continue
        seen.add(lowered)
        examples.append(normalized_line[:500])
        if len(examples) >= EXAMPLE_LIMIT:
            break
    return examples
