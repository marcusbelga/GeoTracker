from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class EventTypeResponse(BaseModel):
    id: int
    slug: str
    label: str
    icon_name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class SourceResponse(BaseModel):
    id: int
    slug: str
    display_name: str
    article_url: str
    article_title: Optional[str] = None
    article_snippet: Optional[str] = None
    published_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EventResponse(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    event_date: date
    lat: float
    lng: float
    location_name: Optional[str] = None
    country: Optional[str] = None
    event_type: EventTypeResponse
    source_count: int
    is_verified: bool
    confidence: float
    source_url: Optional[str] = None   # Primary source article URL
    source_slug: Optional[str] = None  # Primary source slug (e.g. "guardian", "reuters")

    model_config = {"from_attributes": True}


class EventDetailResponse(EventResponse):
    sources: list[SourceResponse] = []


class EventsListResponse(BaseModel):
    events: list[EventResponse]
    total: int
    date: Optional[str] = None


class ScrapeStatusResponse(BaseModel):
    last_run_id: Optional[int] = None
    last_run_status: Optional[str] = None
    last_run_at: Optional[datetime] = None
    events_in_db: int
    next_run_in_seconds: Optional[int] = None
