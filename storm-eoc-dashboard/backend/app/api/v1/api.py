# backend/app/api/v1/api.py
from fastapi import APIRouter
from app.api.v1.endpoints import reports
# Import other endpoints (facilities, storm_tracks, social_media) as they are implemented

api_router = APIRouter()
api_router.include_router(reports.router, prefix="/reports", tags=["community_reports"])
# api_router.include_router(social_media.router, prefix="/social_media", tags=["social_media"])
