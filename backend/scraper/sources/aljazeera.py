"""
Al Jazeera English scraper — Middle East section.
"""
from datetime import datetime
from typing import Optional

from scraper.base_scraper import BaseScraper, RawArticle


class AlJazeeraScraper(BaseScraper):
    source_slug = "aljazeera"

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

            urls_to_scrape = [
                "https://www.aljazeera.com/middle-east/",
                "https://www.aljazeera.com/tag/iran/",
                "https://www.aljazeera.com/tag/israel/",
            ]

            try:
                for url in urls_to_scrape:
                    try:
                        await page.goto(url, timeout=30000)
                        await page.wait_for_timeout(2000)

                        article_els = await page.query_selector_all("article, .article-card, .story-card")

                        for el in article_els[:15]:
                            try:
                                link = await el.query_selector("a[href]")
                                if not link:
                                    continue
                                href = await link.get_attribute("href")
                                if not href or "/liveblog/" in href:
                                    continue
                                full_url = (
                                    f"https://www.aljazeera.com{href}"
                                    if href.startswith("/")
                                    else href
                                )
                                if full_url in seen_urls:
                                    continue
                                seen_urls.add(full_url)

                                heading = await el.query_selector("h2, h3, h4, .article-card__title")
                                title = await heading.inner_text() if heading else ""

                                desc = await el.query_selector("p, .article-card__summary")
                                snippet = await desc.inner_text() if desc else ""

                                time_el = await el.query_selector("time, [datetime]")
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
