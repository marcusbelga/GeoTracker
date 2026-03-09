"""AP News scraper using Playwright."""
from datetime import datetime
from typing import Optional

from scraper.base_scraper import BaseScraper, RawArticle


class APNewsScraper(BaseScraper):
    source_slug = "ap"

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
                await page.goto("https://apnews.com/world-news/middle-east", timeout=30000)
                await page.wait_for_timeout(2000)

                cards = await page.query_selector_all("div.PagePromo, div[class*='Card']")

                for card in cards[:25]:
                    try:
                        link = await card.query_selector("a[href*='/article/']")
                        if not link:
                            continue

                        href = await link.get_attribute("href")
                        if not href:
                            continue
                        url = f"https://apnews.com{href}" if href.startswith("/") else href
                        if url in seen_urls:
                            continue
                        seen_urls.add(url)

                        heading = await card.query_selector("h2, h3")
                        title = await heading.inner_text() if heading else ""

                        desc = await card.query_selector("p")
                        snippet = await desc.inner_text() if desc else ""

                        time_el = await card.query_selector("time, span.Timestamp")
                        published_at: Optional[datetime] = None
                        if time_el:
                            dt_attr = await time_el.get_attribute("data-source")
                            if dt_attr:
                                try:
                                    published_at = datetime.fromisoformat(dt_attr)
                                except ValueError:
                                    pass

                        if title.strip():
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
