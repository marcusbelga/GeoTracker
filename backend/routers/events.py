from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from database.db import get_db
from database.models import Event, EventType, EventSource, ScrapeRun
from schemas.event import (
    EventDetailResponse, EventsListResponse,
    EventTypeResponse, ScrapeStatusResponse, SourceResponse
)

router = APIRouter(prefix="/api/v1", tags=["events"])


@router.get("/events", response_model=EventsListResponse)
def list_events(
    date: Optional[str] = Query(None, description="ISO date e.g. 2026-03-09"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    type: Optional[str] = Query(None, description="Comma-separated event type slugs"),
    verified: Optional[bool] = Query(None),
    limit: int = Query(200, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Event).options(
        joinedload(Event.event_type),
        joinedload(Event.sources).joinedload(EventSource.source),
    )

    if date:
        try:
            parsed = __import__("datetime").date.fromisoformat(date)
            q = q.filter(Event.event_date == parsed)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    elif date_from and date_to:
        try:
            q = q.filter(
                Event.event_date >= __import__("datetime").date.fromisoformat(date_from),
                Event.event_date <= __import__("datetime").date.fromisoformat(date_to),
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from or date_to format.")

    if type:
        slugs = [s.strip() for s in type.split(",")]
        q = q.join(EventType).filter(EventType.slug.in_(slugs))

    if verified is not None:
        q = q.filter(Event.is_verified == verified)

    q = q.order_by(Event.event_date.desc(), Event.confidence.desc())
    events = q.limit(limit).all()

    return EventsListResponse(
        events=events,
        total=len(events),
        date=date,
    )


@router.get("/events/{event_id}", response_model=EventDetailResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = (
        db.query(Event)
        .options(
            joinedload(Event.event_type),
            joinedload(Event.sources).joinedload(EventSource.source),
        )
        .filter(Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Build detail response with source info
    detail = EventDetailResponse.model_validate(event)
    detail.sources = [
        SourceResponse(
            id=es.source.id,
            slug=es.source.slug,
            display_name=es.source.display_name,
            article_url=es.article_url,
            article_title=es.article_title,
            article_snippet=es.article_snippet,
            published_at=es.published_at,
        )
        for es in event.sources
    ]
    return detail


@router.get("/event-types", response_model=list[EventTypeResponse])
def list_event_types(db: Session = Depends(get_db)):
    return db.query(EventType).all()


@router.get("/scrape/status", response_model=ScrapeStatusResponse)
def scrape_status(db: Session = Depends(get_db)):
    last_run = db.query(ScrapeRun).order_by(ScrapeRun.started_at.desc()).first()
    total_events = db.query(Event).count()
    return ScrapeStatusResponse(
        last_run_id=last_run.id if last_run else None,
        last_run_status=last_run.status if last_run else None,
        last_run_at=last_run.finished_at if last_run else None,
        events_in_db=total_events,
    )


@router.get("/health")
def health(db: Session = Depends(get_db)):
    event_count = db.query(Event).count()
    last_run = db.query(ScrapeRun).order_by(ScrapeRun.started_at.desc()).first()
    return {
        "status": "ok",
        "db_events": event_count,
        "last_scrape": last_run.finished_at.isoformat() if last_run and last_run.finished_at else None,
    }
