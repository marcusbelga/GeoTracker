"""
Central scraping pipeline. Runs all source scrapers in parallel,
classifies, geolocates, deduplicates, and persists to database.
"""

import asyncio
import json
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from database.db import SessionLocal
from database.models import Event, EventType, EventSource, NewsSource, ScrapeRun
from .base_scraper import RawArticle
from .parser import classify_event_type
from .geolocator import geolocate_article
from .deduplicator import find_matching_event
from .sources.reuters import ReutersScraper
from .sources.wsj import WSJScraper
from .sources.nyt import NYTScraper
from .sources.cnn import CNNScraper
from .sources.foreign_affairs import ForeignAffairsScraper
from .sources.dw import DWScraper
from .sources.ft import FTScraper

logger = logging.getLogger(__name__)

SCRAPERS = [
    ReutersScraper,
    WSJScraper,
    NYTScraper,
    CNNScraper,
    ForeignAffairsScraper,
    DWScraper,
    FTScraper,
]


async def _collect_all() -> list[RawArticle]:
    """Run all scrapers in parallel."""
    tasks = [scraper_cls().run() for scraper_cls in SCRAPERS]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    articles: list[RawArticle] = []
    for scraper_cls, result in zip(SCRAPERS, results):
        if isinstance(result, Exception):
            logger.error(f"{scraper_cls.__name__} failed: {result}")
        else:
            articles.extend(result)
            logger.info(f"{scraper_cls.__name__}: {len(result)} relevant articles")

    return articles


def _get_or_create_event_type(db: Session, slug: str) -> EventType:
    et = db.query(EventType).filter_by(slug=slug).first()
    if not et:
        et = db.query(EventType).filter_by(slug="diplomatic").first()
    return et


def _get_source(db: Session, slug: str) -> NewsSource:
    return db.query(NewsSource).filter_by(slug=slug).first()


async def run_scrape_pipeline(run_id: int):
    """
    Main pipeline. Called by scheduler or admin endpoint.
    """
    db = SessionLocal()
    run = db.query(ScrapeRun).get(run_id)
    errors: list[str] = []
    articles_found = 0
    events_created = 0
    events_updated = 0

    try:
        # 1. COLLECT
        articles = await _collect_all()
        articles_found = len(articles)
        logger.info(f"Run {run_id}: collected {articles_found} articles")

        for article in articles:
            try:
                # 2. CLASSIFY
                event_type_slug, confidence = classify_event_type(article)

                # 3. GEOLOCATE
                lat, lng, location_name, country = await geolocate_article(article)
                if lat is None:
                    continue  # Skip ungeolocatable articles

                # 4. Parse date
                event_date = (
                    article.published_at.date() if article.published_at else datetime.utcnow().date()
                )

                # 5. DEDUPLICATE
                existing_id = find_matching_event(
                    db, article.title, lat, lng, event_type_slug, event_date
                )

                source = _get_source(db, article.source_slug)
                if not source:
                    continue

                if existing_id:
                    # Check if this source already contributed
                    already_has = (
                        db.query(EventSource)
                        .filter_by(event_id=existing_id, source_id=source.id)
                        .first()
                    )
                    if not already_has:
                        es = EventSource(
                            event_id=existing_id,
                            source_id=source.id,
                            article_url=article.url,
                            article_title=article.title,
                            article_snippet=article.snippet,
                            published_at=article.published_at,
                        )
                        db.add(es)

                        # Update event metadata
                        event = db.query(Event).get(existing_id)
                        event.source_count = (
                            db.query(EventSource).filter_by(event_id=existing_id).count() + 1
                        )
                        # Verified if 2+ DIFFERENT sources
                        source_slugs = {
                            s.source.slug for s in event.sources if s.source
                        } | {source.slug}
                        event.is_verified = len(source_slugs) >= 2
                        event.confidence = min(event.confidence + 0.1, 1.0)
                        events_updated += 1
                else:
                    # 6. CREATE new event
                    event_type = _get_or_create_event_type(db, event_type_slug)
                    event = Event(
                        title=article.title,
                        summary=article.snippet,
                        event_date=event_date,
                        event_time=article.published_at.time() if article.published_at else None,
                        lat=lat,
                        lng=lng,
                        location_name=location_name,
                        country=country,
                        event_type_id=event_type.id,
                        source_count=1,
                        is_verified=False,
                        confidence=confidence,
                    )
                    db.add(event)
                    db.flush()  # get event.id

                    es = EventSource(
                        event_id=event.id,
                        source_id=source.id,
                        article_url=article.url,
                        article_title=article.title,
                        article_snippet=article.snippet,
                        published_at=article.published_at,
                    )
                    db.add(es)
                    events_created += 1

                db.commit()

            except Exception as e:
                db.rollback()
                errors.append(str(e))
                logger.exception(f"Error processing article '{article.title}': {e}")

        # 7. Finalize run
        run.status = "partial" if errors else "success"

    except Exception as e:
        errors.append(str(e))
        run.status = "failed"
        logger.exception(f"Pipeline run {run_id} failed: {e}")

    finally:
        run.finished_at = datetime.utcnow()
        run.articles_found = articles_found
        run.events_created = events_created
        run.events_updated = events_updated
        run.errors = json.dumps(errors) if errors else None
        db.commit()
        db.close()

        logger.info(
            f"Run {run_id} done: {articles_found} articles, "
            f"{events_created} created, {events_updated} updated, "
            f"{len(errors)} errors"
        )
