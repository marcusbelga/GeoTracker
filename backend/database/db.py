import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base, EventType, NewsSource

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/geotracker.db")

# SQLite: allow same-thread access from async context via check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


EVENT_TYPES = [
    {"slug": "airstrike", "label": "Airstrike / Bombing", "icon_name": "pin-airstrike",
     "description": "Air strikes, bombings, and explosive attacks"},
    {"slug": "missile", "label": "Missile / Drone Attack", "icon_name": "pin-missile",
     "description": "Missile launches, rocket fire, and drone attacks"},
    {"slug": "diplomatic", "label": "Diplomatic Event", "icon_name": "pin-diplomatic",
     "description": "Negotiations, meetings, agreements, and diplomatic activity"},
    {"slug": "political", "label": "Political / Elections", "icon_name": "pin-political",
     "description": "Elections, political decisions, and government actions"},
    {"slug": "ground-ops", "label": "Ground Operations", "icon_name": "pin-ground",
     "description": "Ground troop movements, invasions, and military operations"},
    {"slug": "sanctions", "label": "Sanctions / Economic", "icon_name": "pin-sanctions",
     "description": "Economic sanctions, trade restrictions, and financial measures"},
    {"slug": "protest", "label": "Protest / Civil Unrest", "icon_name": "pin-protest",
     "description": "Protests, demonstrations, riots, and civil unrest"},
]

NEWS_SOURCES = [
    {"slug": "reuters", "display_name": "Reuters", "base_url": "https://www.reuters.com",
     "credibility": 1.0, "scraper_type": "playwright"},
    {"slug": "ap", "display_name": "Associated Press", "base_url": "https://apnews.com",
     "credibility": 1.0, "scraper_type": "playwright"},
    {"slug": "bbc", "display_name": "BBC News", "base_url": "https://www.bbc.com/news",
     "credibility": 0.95, "scraper_type": "playwright"},
    {"slug": "guardian", "display_name": "The Guardian", "base_url": "https://www.theguardian.com",
     "credibility": 0.9, "scraper_type": "api"},
    {"slug": "aljazeera", "display_name": "Al Jazeera", "base_url": "https://www.aljazeera.com",
     "credibility": 0.85, "scraper_type": "playwright"},
    {"slug": "gdelt", "display_name": "GDELT Project", "base_url": "https://gdeltproject.org",
     "credibility": 0.8, "scraper_type": "api"},
]


def init_db():
    """Create all tables and seed reference data."""
    # Ensure data directory exists (for SQLite file path)
    db_path = DATABASE_URL.replace("sqlite:///", "")
    if db_path.startswith("./"):
        os.makedirs(os.path.dirname(db_path.lstrip("./")), exist_ok=True)
    os.makedirs("data", exist_ok=True)

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Seed event types
        for et in EVENT_TYPES:
            if not db.query(EventType).filter_by(slug=et["slug"]).first():
                db.add(EventType(**et))

        # Seed news sources
        for ns in NEWS_SOURCES:
            if not db.query(NewsSource).filter_by(slug=ns["slug"]).first():
                db.add(NewsSource(**ns))

        db.commit()
    finally:
        db.close()
