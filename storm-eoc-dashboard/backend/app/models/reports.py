# backend/app/models/reports.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from geoalchemy2 import Geometry
from app.models.base import Base

class CommunityReport(Base):
    __tablename__ = "community_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(100), nullable=False)
    description = Column(Text)
    report_timestamp = Column(DateTime(timezone=True), nullable=False)
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    image_url = Column(String(255))
    verified = Column(Boolean, default=False)
    status = Column(String(50), default="Submitted")
