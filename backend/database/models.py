from datetime import datetime, date, time
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, Time,
    DateTime, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


class EventType(Base):
    __tablename__ = "event_types"

    id = Column(Integer, primary_key=True)
    slug = Column(String(50), unique=True, nullable=False)
    label = Column(String(100), nullable=False)
    icon_name = Column(String(50), nullable=False)
    description = Column(Text)

    events = relationship("Event", back_populates="event_type")


class NewsSource(Base):
    __tablename__ = "news_sources"

    id = Column(Integer, primary_key=True)
    slug = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    base_url = Column(String(255), nullable=False)
    credibility = Column(Float, default=1.0)
    scraper_type = Column(String(20))  # "playwright" | "api"
    is_active = Column(Boolean, default=True)

    event_sources = relationship("EventSource", back_populates="source")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    summary = Column(Text)
    event_date = Column(Date, nullable=False, index=True)
    event_time = Column(Time)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    location_name = Column(String(255))
    country = Column(String(100))
    event_type_id = Column(Integer, ForeignKey("event_types.id"), nullable=False)
    source_count = Column(Integer, default=1)
    is_verified = Column(Boolean, default=False)
    confidence = Column(Float, default=0.5)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    event_type = relationship("EventType", back_populates="events")
    sources = relationship("EventSource", back_populates="event", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_events_date_type", "event_date", "event_type_id"),
        Index("idx_events_location", "lat", "lng"),
        Index("idx_events_verified", "is_verified"),
    )


class EventSource(Base):
    __tablename__ = "event_sources"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"))
    source_id = Column(Integer, ForeignKey("news_sources.id"))
    article_url = Column(String(2000), nullable=False)
    article_title = Column(String(500))
    article_snippet = Column(Text)
    published_at = Column(DateTime)
    scraped_at = Column(DateTime, default=datetime.utcnow)
    raw_content = Column(Text)

    event = relationship("Event", back_populates="sources")
    source = relationship("NewsSource", back_populates="event_sources")


class ScrapeRun(Base):
    __tablename__ = "scrape_runs"

    id = Column(Integer, primary_key=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime)
    articles_found = Column(Integer, default=0)
    events_created = Column(Integer, default=0)
    events_updated = Column(Integer, default=0)
    errors = Column(Text)  # JSON array
    status = Column(String(20))  # "running" | "success" | "partial" | "failed"
