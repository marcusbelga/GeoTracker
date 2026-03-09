import asyncio
import logging
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from database.db import SessionLocal
from database.models import ScrapeRun

logger = logging.getLogger(__name__)
_scheduler = BackgroundScheduler()


def _run_pipeline_sync(interval_minutes: int):
    """Wrapper to run the async pipeline from the sync APScheduler."""
    db = SessionLocal()
    run = ScrapeRun(status="running")
    db.add(run)
    db.commit()
    db.refresh(run)
    run_id = run.id
    db.close()

    logger.info(f"Scheduler: starting scrape run {run_id}")

    from scraper.orchestrator import run_scrape_pipeline
    asyncio.run(run_scrape_pipeline(run_id))


def start_scheduler(interval_minutes: int = 30):
    if not _scheduler.running:
        _scheduler.add_job(
            _run_pipeline_sync,
            trigger=IntervalTrigger(minutes=interval_minutes),
            args=[interval_minutes],
            id="scrape_pipeline",
            next_run_time=datetime.now(),  # Run immediately on startup too
            replace_existing=True,
        )
        _scheduler.start()
        logger.info(f"Scheduler started: scraping every {interval_minutes} minutes")


def stop_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
