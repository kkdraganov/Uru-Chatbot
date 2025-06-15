from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import AsyncAdaptedQueuePool
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

# Create declarative base for models
Base = declarative_base()

async def get_db() -> AsyncSession:
    """Dependency for getting async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
