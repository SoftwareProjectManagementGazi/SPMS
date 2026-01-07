import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.infrastructure.config import settings
from app.infrastructure.database.models import Base
# Import all models to ensure they are registered with Base.metadata
from app.infrastructure.database.models import * 
from app.api.main import app
from app.infrastructure.database.database import get_db_session
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator

# Use the database URL from settings.
# In a real CI/CD pipeline, you might want to override this with a specific test DB URL.
# For local development, this assumes the docker-compose DB is running.
DB_URL = settings.DATABASE_URL

@pytest_asyncio.fixture(scope="session")
async def db_engine():
    """
    Creates a database engine for the test session.
    Creates all tables at the start of the session.
    """
    # Use NullPool to avoid Asyncio Event Loop issues during tests
    engine = create_async_engine(DB_URL, poolclass=NullPool)
    
    async with engine.begin() as conn:
        # Create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
        
    yield engine
    
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine):
    """
    Creates a fresh database session for each test function.
    Rolls back the transaction after the test to ensure isolation.
    """
    # Connect to the database
    connection = await db_engine.connect()
    # Begin a transaction
    trans = await connection.begin()
    
    # Create a session bound to this connection
    session_factory = async_sessionmaker(bind=connection, class_=AsyncSession, expire_on_commit=False)
    session = session_factory()
    
    yield session
    
    # Rollback the transaction and close connection
    await session.close()
    await trans.rollback()
    await connection.close()

@pytest_asyncio.fixture(scope="function")
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    """
    Creates a FastAPI test client with dependency overrides.
    Uses the transactional db_session.
    """
    # Override the get_db_session dependency to return our test session
    app.dependency_overrides[get_db_session] = lambda: db_session
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    
    # Clear overrides
    app.dependency_overrides.clear()
