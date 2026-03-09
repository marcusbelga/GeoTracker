import os
from datetime import datetime
from typing import Optional
import httpx

from scraper.base_scraper import BaseScraper, RawArticle

GUARDIAN_API_KEY = os.getenv("GUARDIAN_API_KEY", "test")  # "test" = free unauthenticated tier

SEARCH_QUERIES = [
    "iran israel conflict",
    "iran us military",
    "iran nuclear",
    "israel airstrike",
    "idf military operation",
    "hezbollah israel",
    "hamas",
    "iran sanctions",
]


class GuardianScraper(BaseScraper):
    source_slug = "guardian"

    async def fetch_articles(self) -> list[RawArticle]:
        articles: list[RawArticle] = []
        seen_urls: set[str] = set()

        async with httpx.AsyncClient(timeout=15.0) as client:
            for query in SEARCH_QUERIES:
                try:
                    resp = await client.get(
                        "https://content.guardianapis.com/search",
                        params={
                            "q": query,
                            "section": "world",
                            "page-size": 10,
                            "show-fields": "trailText,publication",
                            "order-by": "newest",
                            "api-key": GUARDIAN_API_KEY,
                        },
                    )
                    data = resp.json()
                    results = data.get("response", {}).get("results", [])

                    for item in results:
                        url = item.get("webUrl", "")
                        if url in seen_urls:
                            continue
                        seen_urls.add(url)

                        published_str = item.get("webPublicationDate")
                        published_at: Optional[datetime] = None
                        if published_str:
                            try:
                                published_at = datetime.fromisoformat(
                                    published_str.replace("Z", "+00:00")
                                )
                            except ValueError:
                                pass

                        snippet = item.get("fields", {}).get("trailText", "")

                        articles.append(RawArticle(
                            url=url,
                            title=item.get("webTitle", ""),
                            snippet=snippet,
                            source_slug=self.source_slug,
                            published_at=published_at,
                        ))

                except Exception as e:
                    pass  # Log handled by orchestrator

        return articles
