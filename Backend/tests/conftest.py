import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text, make_url
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator

from app.api.main import app
from app.infrastructure.config import settings
from app.infrastructure.database.models import Base
# Import all models to ensure metadata is populated
from app.infrastructure.database.models import *
from app.infrastructure.database.database import get_db_session

# --- Database Setup for Integration Tests ---

@pytest_asyncio.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest_asyncio.fixture(scope="session")
async def db_engine():
    """
    Creates a dedicated TEST database (e.g. spms_db_test) for the test session.
    Drops the test database if it exists, creates it fresh, and creates all tables.
    Isolates tests from the main development database.
    """
    # 1. Parse the original database URL
    original_url = make_url(settings.DATABASE_URL)
    
    # 2. Determine Test DB Name
    test_db_name = f"{original_url.database}_test"
    
    # 3. Connect to default 'postgres' database to create/drop the test DB
    # We need isolation_level="AUTOCOMMIT" to execute CREATE/DROP DATABASE
    postgres_url = original_url.set(database="postgres")
    
    admin_engine = create_async_engine(postgres_url, isolation_level="AUTOCOMMIT")
    
    async with admin_engine.connect() as conn:
        # Terminate existing connections to the test db if any (to allow drop)
        # This is specific to PostgreSQL
        await conn.execute(text(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{test_db_name}'
            AND pid <> pg_backend_pid();
        """))
        
        # Drop existing test database
        await conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name}"))
        
        # Create new test database
        await conn.execute(text(f"CREATE DATABASE {test_db_name}"))
        
    await admin_engine.dispose()
    
    # 4. Connect to the new TEST database
    test_db_url = original_url.set(database=test_db_name)
    engine = create_async_engine(test_db_url, poolclass=NullPool)
    
    # 5. Create Tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    yield engine
    
    # Cleanup (Optional: Drop DB after tests? Keeping it is better for debugging failures)
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine):
    """
    Creates a fresh database session for each test function.
    Rolls back the transaction after the test to ensure isolation within the test DB.
    """
    connection = await db_engine.connect()
    trans = await connection.begin()
    
    session_factory = async_sessionmaker(bind=connection, class_=AsyncSession, expire_on_commit=False)
    session = session_factory()
    
    yield session
    
    # Rollback transaction to clean up data inserted during the test
    await session.close()
    await trans.rollback()
    await connection.close()

@pytest_asyncio.fixture(scope="function")
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    """
    Creates a FastAPI test client.
    Overrides the database dependency to use the test session (with rollback).
    """
    # Override the get_db_session dependency to return our transactional session
    app.dependency_overrides[get_db_session] = lambda: db_session
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    
    app.dependency_overrides.clear()
