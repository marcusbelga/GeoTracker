"""
Reuters scraper using Playwright headless browser.
Scrapes the search results page for Middle East/Iran/Israel content.
"""
from datetime import datetime
from typing import Optional

from scraper.base_scraper import BaseScraper, RawArticle

REUTERS_SEARCH_URLS = [
    "https://www.reuters.com/world/middle-east/",
    "https://www.reuters.com/search/news?blob=iran",
    "https://www.reuters.com/search/news?blob=israel",
]


class ReutersScraper(BaseScraper):
    source_slug = "reuters"

    async def fetch_articles(self) -> list[RawArticle]:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            return []

        articles: list[RawArticle] = []
        seen_urls: set[str] = set()

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
            page = await browser.new_page()
            await page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
            })

            try:
                await page.goto("https://www.reuters.com/world/middle-east/", timeout=30000)
                await page.wait_for_timeout(2000)

                # Find article links and titles
                article_elements = await page.query_selector_all("article")

                for el in article_elements[:20]:
                    try:
                        link = await el.query_selector("a[href*='/world/']")
                        if not link:
                            continue

                        href = await link.get_attribute("href")
                        if not href:
                            continue
                        url = f"https://www.reuters.com{href}" if href.startswith("/") else href
                        if url in seen_urls:
                            continue
                        seen_urls.add(url)

                        heading = await el.query_selector("h3, h2, h4")
                        title = await heading.inner_text() if heading else ""

                        desc = await el.query_selector("p")
                        snippet = await desc.inner_text() if desc else ""

                        time_el = await el.query_selector("time")
                        published_at: Optional[datetime] = None
                        if time_el:
                            dt_str = await time_el.get_attribute("datetime")
                            if dt_str:
                                try:
                                    published_at = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
                                except ValueError:
                                    pass

                        if title:
                            articles.append(RawArticle(
                                url=url,
                                title=title.strip(),
                                snippet=snippet.strip(),
                                source_slug=self.source_slug,
                                published_at=published_at,
                            ))
                    except Exception:
                        continue

            except Exception:
                pass
            finally:
                await browser.close()

        return articles
