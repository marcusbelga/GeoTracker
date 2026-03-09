"""
Matches new articles against existing events in the database.
Uses haversine distance + title similarity + same event_type + same day.
"""

import math
from difflib import SequenceMatcher
from dataclasses import dataclass
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session
from database.models import Event, EventType


DEDUP_RADIUS_KM = 50
DEDUP_TITLE_SIMILARITY = 0.65


@dataclass
class CandidateEvent:
    id: int
    title: str
    lat: float
    lng: float
    event_type_slug: str
    event_date: date
    source_ids: set[int]  # which news_sources already contributed


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _title_similarity(t1: str, t2: str) -> float:
    return SequenceMatcher(None, t1.lower(), t2.lower()).ratio()


def find_matching_event(
    db: Session,
    title: str,
    lat: float,
    lng: float,
    event_type_slug: str,
    event_date: date,
) -> Optional[int]:
    """
    Returns the event ID if a matching event is found, else None.
    Matching criteria: same event_type + same day + within radius + title similarity.
    """
    candidates = (
        db.query(Event)
        .join(EventType)
        .filter(
            Event.event_date == event_date,
            EventType.slug == event_type_slug,
        )
        .all()
    )

    for candidate in candidates:
        dist = _haversine_km(lat, lng, candidate.lat, candidate.lng)
        sim = _title_similarity(title, candidate.title)

        if dist <= DEDUP_RADIUS_KM and sim >= DEDUP_TITLE_SIMILARITY:
            return candidate.id

    return None
