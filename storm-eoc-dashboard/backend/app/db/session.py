# backend/app/db/session.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings

# Async engine for FastAPI
engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
SessionLocalAsync = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)

# Sync engine for Celery workers (simplified approach)
engine_sync = create_engine(settings.SQLALCHEMY_DATABASE_URI_SYNC, pool_pre_ping=True)
SessionLocalSync = sessionmaker(autocommit=False, autoflush=False, bind=engine_sync)

# Dependency injection for FastAPI
async def get_db() -> AsyncSession:
    async with SessionLocalAsync() as session:
        yield session
