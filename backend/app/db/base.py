from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.pool import AsyncAdaptedQueuePool
from sqlalchemy import DateTime, func
from datetime import datetime
from typing import AsyncGenerator
import logging

from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# DEBUG: Log database connection setup (base.py:engine_creation)
database_url = settings.DATABASE_URL
logger.info(f"[DB] Creating async engine with DATABASE_URL: {database_url}")
logger.info(f"[DB] Engine config - pool_size: 20, max_overflow: 10, pool_timeout: 30s, pool_recycle: 1800s")

# Create async engine with connection pooling
engine = create_async_engine(
    database_url,
    echo=True,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800
)

# Create async session factory with proper configuration
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Create declarative base for models using SQLAlchemy 2.0 syntax
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


class TimestampMixin:
    """Mixin class for common timestamp fields."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
