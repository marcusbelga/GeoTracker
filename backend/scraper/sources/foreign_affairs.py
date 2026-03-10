"""Foreign Affairs — Middle East & Iran/Israel articles scraper."""
from datetime import datetime
from typing import Optional

from scraper.base_scraper import BaseScraper, RawArticle


class ForeignAffairsScraper(BaseScraper):
    source_slug = "foreign-affairs"
    min_keyword_matches = 1  # Longer-form analysis; fewer but denser articles

    async def fetch_articles(self) -> list[RawArticle]:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            return []

        articles: list[RawArticle] = []
        seen_urls: set[str] = set()

        urls = [
            "https://www.foreignaffairs.com/middle-east",
            "https://www.foreignaffairs.com/israel",
            "https://www.foreignaffairs.com/iran",
        ]

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
            page = await browser.new_page()
            await page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                              "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
            })

            try:
                for url in urls:
                    try:
                        await page.goto(url, timeout=30000)
                        await page.wait_for_timeout(2500)

                        items = await page.query_selector_all(
                            "article, [class*='article-card'], [class*='article-teaser']"
                        )

                        for el in items[:15]:
                            try:
                                link = await el.query_selector("a[href*='/articles/']")
                                if not link:
                                    link = await el.query_selector("a[href]")
                                if not link:
                                    continue
                                href = await link.get_attribute("href")
                                if not href:
                                    continue
                                full_url = (
                                    f"https://www.foreignaffairs.com{href}"
                                    if href.startswith("/") else href
                                )
                                if full_url in seen_urls:
                                    continue
                                seen_urls.add(full_url)

                                heading = await el.query_selector("h2, h3, h4, [class*='title']")
                                title = await heading.inner_text() if heading else ""
                                title = title.strip()
                                if not title or len(title) < 10:
                                    continue

                                desc = await el.query_selector("p, [class*='dek'], [class*='summary']")
                                snippet = await desc.inner_text() if desc else ""

                                time_el = await el.query_selector("time, [class*='date']")
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

                                articles.append(RawArticle(
                                    url=full_url,
                                    title=title,
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
