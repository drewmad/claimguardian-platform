# backend/app/models/social_media.py
from sqlalchemy import Column, BigInteger, String, Text, DateTime, Float, ARRAY
from geoalchemy2 import Geometry
from app.models.base import Base

class XPost(Base):
    __tablename__ = "x_posts"

    id = Column(BigInteger, primary_key=True, index=True)
    post_id = Column(String(255), unique=True, nullable=False)
    author_id = Column(String(255))
    author_username = Column(String(255))
    content = Column(Text, nullable=False)
    post_timestamp = Column(DateTime(timezone=True), nullable=False)
    geo_location = Column(Geometry("POINT", srid=4326))
    geo_source = Column(String(50))
    relevancy_score = Column(Float, default=0.0)
    sentiment = Column(String(50))
    sentiment_score = Column(Float)
    keywords = Column(ARRAY(Text))
    hashtags = Column(ARRAY(Text))
