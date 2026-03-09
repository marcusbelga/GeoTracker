import os
from fastapi import APIRouter, Depends, Header, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import ScrapeRun

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

ADMIN_KEY = os.getenv("ADMIN_KEY", "changeme")


def verify_admin(x_admin_key: str = Header(...)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")


@router.post("/scrape")
async def trigger_scrape(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    """Manually trigger a scrape run."""
    from scraper.orchestrator import run_scrape_pipeline

    run = ScrapeRun(status="running")
    db.add(run)
    db.commit()
    db.refresh(run)

    background_tasks.add_task(run_scrape_pipeline, run.id)

    return {"run_id": run.id, "status": "started"}
