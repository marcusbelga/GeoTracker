"""
Times of Israel scraper — Israeli perspective English news.
"""
from datetime import datetime
from typing import Optional

from scraper.base_scraper import BaseScraper, RawArticle

TOI_URLS = [
    "https://www.timesofisrael.com/liveblog-category/iran/",
    "https://www.timesofisrael.com/topic/iran/",
    "https://www.timesofisrael.com/",
]


class TimesOfIsraelScraper(BaseScraper):
    source_slug = "times-of-israel"

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
                for url in TOI_URLS:
                    try:
                        await page.goto(url, timeout=30000)
                        await page.wait_for_timeout(2000)

                        article_els = await page.query_selector_all(
                            "article, .item, .featured-article, [class*='story']"
                        )

                        for el in article_els[:15]:
                            try:
                                link = await el.query_selector("a[href*='timesofisrael.com'], a[href^='/']")
                                if not link:
                                    continue
                                href = await link.get_attribute("href")
                                if not href:
                                    continue
                                full_url = (
                                    f"https://www.timesofisrael.com{href}"
                                    if href.startswith("/")
                                    else href
                                )
                                if full_url in seen_urls:
                                    continue
                                seen_urls.add(full_url)

                                heading = await el.query_selector("h2, h3, h4, .title")
                                title = await heading.inner_text() if heading else ""

                                desc = await el.query_selector("p, .excerpt")
                                snippet = await desc.inner_text() if desc else ""

                                time_el = await el.query_selector("time, [datetime], .date")
                                published_at: Optional[datetime] = None
                                if time_el:
                                    dt_str = await time_el.get_attribute("datetime")
                                    if dt_str:
                                        try:
                                            published_at = datetime.fromisoformat(
                                                dt_str.replace("Z", "+00:00")
                                            )
                                        except ValueError:
                                            pass

                                if title.strip():
                                    articles.append(RawArticle(
                                        url=full_url,
                                        title=title.strip(),
                                        snippet=snippet.strip(),
                                        source_slug=self.source_slug,
                                        published_at=published_at,
                                    ))
                            except Exception:
                                continue
                    except Exception:
                        continue
            finally:
                await browser.close()

        return articles
