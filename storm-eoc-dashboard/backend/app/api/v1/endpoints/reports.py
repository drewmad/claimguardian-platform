# backend/app/api/v1/endpoints/reports.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from geoalchemy2 import WKTElement
from datetime import datetime, timedelta
import json

from app.db.session import get_db
from app.models.reports import CommunityReport
from app.schemas.reports import CommunityReportCreate, CommunityReportGeoJSON, CommunityReportProperties
from app.ws.manager import manager

router = APIRouter()

@router.post("/", response_model=CommunityReportGeoJSON)
async def create_community_report(
    report_in: CommunityReportCreate, db: AsyncSession = Depends(get_db)
):
    """
    Create a new community report (Crowdsourced data ingestion).
    """
    # Create PostGIS geometry from coordinates
    location_wkt = WKTElement(
        f"POINT({report_in.location.longitude} {report_in.location.latitude})", srid=4326
    )
    db_obj = CommunityReport(
        report_type=report_in.report_type,
        description=report_in.description,
        location=location_wkt,
        image_url=report_in.image_url,
        report_timestamp=datetime.utcnow(),
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)

    # Construct GeoJSON response
    properties = CommunityReportProperties.from_orm(db_obj)
    geometry = {
        "type": "Point",
        "coordinates": [report_in.location.longitude, report_in.location.latitude]
    }
    report_geojson = CommunityReportGeoJSON(geometry=geometry, properties=properties)

    # Broadcast new report via WebSocket
    # Use default=str to handle datetime serialization
    await manager.broadcast(report_geojson.json(default=str))

    return report_geojson

@router.get("/", response_model=list[CommunityReportGeoJSON])
async def read_community_reports(
    db: AsyncSession = Depends(get_db), 
    hours: int = 24 # Default to last 24 hours
):
    """
    Retrieve community reports as GeoJSON Features within a time window.
    """
    time_filter = datetime.utcnow() - timedelta(hours=hours)

    # Use ST_AsGeoJSON to get the geometry directly from the database
    query = select(
        CommunityReport,
        func.ST_AsGeoJSON(CommunityReport.location).label("geojson_geometry")
    ).where(CommunityReport.report_timestamp >= time_filter
    ).order_by(desc(CommunityReport.report_timestamp))
    
    result = await db.execute(query)
    rows = result.all()

    # Construct GeoJSON features
    features = []
    for report, geojson_geom_str in rows:
        properties = CommunityReportProperties.from_orm(report)
        geometry = json.loads(geojson_geom_str)
        feature = CommunityReportGeoJSON(geometry=geometry, properties=properties)
        features.append(feature)
        
    return features
