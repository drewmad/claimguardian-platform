# backend/app/worker.py
from celery import Celery
from app.core.config import settings

# Initialize Celery application
celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    # Include task modules
    include=["app.ingestion.official_data", "app.ingestion.satellite_imagery", "app.ingestion.social_media_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Define periodic tasks (Celery Beat schedule)
celery_app.conf.beat_schedule = {
    "fetch-noaa-data-every-15min": {
        "task": "app.ingestion.official_data.fetch_noaa_data",
        "schedule": 900.0,
    },
    "search-satellite-imagery-every-hour": {
        "task": "app.ingestion.satellite_imagery.search_satellite_imagery",
        "schedule": 3600.0,
    },
    # The X stream (social_media.py) is a long-running process, typically managed separately 
    # (e.g., as a dedicated service in docker-compose or Kubernetes deployment), 
    # not scheduled via Celery Beat.
    # If we want Celery to manage the long-running stream (less ideal but possible):
    # "ensure-x-stream-running": {
    #     "task": "app.ingestion.social_media_tasks.ensure_x_stream_running",
    #     "schedule": 60.0, # Check every minute if the stream task is active
    # },
}
