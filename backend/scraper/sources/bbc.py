"""BBC News Middle East section scraper using Playwright."""
from datetime import datetime
from typing import Optional

from scraper.base_scraper import BaseScraper, RawArticle


class BBCScraper(BaseScraper):
    source_slug = "bbc"

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

            try:
                await page.goto("https://www.bbc.com/news/world/middle_east", timeout=30000)
                await page.wait_for_timeout(2000)

                # BBC article cards
                links = await page.query_selector_all("a[href*='/news/']")

                for link in links[:40]:
                    try:
                        href = await link.get_attribute("href")
                        if not href or "articles" not in href and "/news/world" not in href:
                            continue

                        url = f"https://www.bbc.com{href}" if href.startswith("/") else href
                        if url in seen_urls:
                            continue
                        seen_urls.add(url)

                        title_el = await link.query_selector("h3, h2, span[data-testid='card-headline']")
                        title = await title_el.inner_text() if title_el else await link.inner_text()
                        title = title.strip()

                        if not title or len(title) < 10:
                            continue

                        desc_el = await link.query_selector("p")
                        snippet = await desc_el.inner_text() if desc_el else ""

                        articles.append(RawArticle(
                            url=url,
                            title=title,
                            snippet=snippet.strip(),
                            source_slug=self.source_slug,
                            published_at=None,
                        ))
                    except Exception:
                        continue

            except Exception:
                pass
            finally:
                await browser.close()

        return articles
