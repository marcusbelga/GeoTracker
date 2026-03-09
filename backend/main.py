import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.db import init_db
from routers.events import router as events_router
from routers.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize DB + start scheduler
    init_db()

    scrape_interval = int(os.getenv("SCRAPE_INTERVAL_MINUTES", "30"))
    if scrape_interval > 0:
        from utils.scheduler import start_scheduler
        start_scheduler(scrape_interval)

    yield

    # Shutdown: stop scheduler
    from utils.scheduler import stop_scheduler
    stop_scheduler()


app = FastAPI(
    title="GeoTracker API",
    description="Iran-US-Israel Conflict News Tracker",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for Next.js frontend
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {"message": "GeoTracker API", "docs": "/docs"}
