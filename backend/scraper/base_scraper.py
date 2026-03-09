from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


RELEVANCE_KEYWORDS = [
    "iran", "israel", "israeli", "idf", "irgc", "tehran", "tel aviv",
    "jerusalem", "netanyahu", "khamenei", "hezbollah", "hamas", "gaza",
    "west bank", "strait of hormuz", "beirut", "damascus", "houthi",
    "nuclear", "enrichment", "centrifuge", "natanz", "fordow",
    "us military", "pentagon", "middle east", "persian gulf",
]


@dataclass
class RawArticle:
    url: str
    title: str
    snippet: str
    source_slug: str
    published_at: Optional[datetime] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_hint: Optional[str] = None  # e.g. "Tehran" from article metadata


class BaseScraper(ABC):
    source_slug: str = ""
    min_keyword_matches: int = 2

    @abstractmethod
    async def fetch_articles(self) -> list[RawArticle]:
        pass

    async def run(self) -> list[RawArticle]:
        articles = await self.fetch_articles()
        return [a for a in articles if self._is_relevant(a)]

    def _is_relevant(self, article: RawArticle) -> bool:
        text = f"{article.title} {article.snippet}".lower()
        matches = sum(1 for kw in RELEVANCE_KEYWORDS if kw in text)
        return matches >= self.min_keyword_matches
