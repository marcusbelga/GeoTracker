"""
GDELT GEO 2.0 API - Returns pre-geolocated news articles.
No API key required. Best source for geographic data.
"""
from datetime import datetime
from typing import Optional
import httpx

from scraper.base_scraper import BaseScraper, RawArticle

GDELT_QUERIES = [
    "iran israel",
    "iran united states military",
    "iran nuclear",
    "hezbollah hamas",
]


class GDELTScraper(BaseScraper):
    source_slug = "gdelt"
    min_keyword_matches = 1  # GDELT already filters geopolitically

    async def fetch_articles(self) -> list[RawArticle]:
        articles: list[RawArticle] = []
        seen_urls: set[str] = set()

        async with httpx.AsyncClient(timeout=20.0) as client:
            for query in GDELT_QUERIES:
                try:
                    # GDELT Article List API
                    resp = await client.get(
                        "https://api.gdeltproject.org/api/v2/doc/doc",
                        params={
                            "query": query,
                            "mode": "artlist",
                            "maxrecords": 25,
                            "format": "json",
                            "timespan": "7d",
                        },
                    )
                    data = resp.json()
                    items = data.get("articles", [])

                    for item in items:
                        url = item.get("url", "")
                        if url in seen_urls:
                            continue
                        seen_urls.add(url)

                        # Parse date (GDELT format: YYYYMMDDHHMMSS)
                        date_str = item.get("seendate", "")
                        published_at: Optional[datetime] = None
                        if date_str:
                            try:
                                published_at = datetime.strptime(date_str, "%Y%m%dT%H%M%SZ")
                            except ValueError:
                                try:
                                    published_at = datetime.strptime(date_str[:8], "%Y%m%d")
                                except ValueError:
                                    pass

                        articles.append(RawArticle(
                            url=url,
                            title=item.get("title", ""),
                            snippet=item.get("title", ""),  # GDELT artlist doesn't include body
                            source_slug=self.source_slug,
                            published_at=published_at,
                            location_hint=item.get("sourcecountry"),
                        ))

                except Exception:
                    pass

        return articles
