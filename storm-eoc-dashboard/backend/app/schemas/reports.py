# backend/app/schemas/reports.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class Location(BaseModel):
    latitude: float
    longitude: float

class CommunityReportCreate(BaseModel):
    report_type: str
    description: Optional[str] = None
    location: Location
    image_url: Optional[str] = None

# Properties of the report (for GeoJSON properties field)
class CommunityReportProperties(BaseModel):
    id: int
    report_type: str
    description: Optional[str]
    report_timestamp: datetime
    verified: bool
    status: str
    image_url: Optional[str]

    class Config:
        orm_mode = True

# GeoJSON Feature schema for the response
class CommunityReportGeoJSON(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: CommunityReportProperties
