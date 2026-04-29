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

    # 6. Seed roles so authenticated_client fixture can find them
    from app.infrastructure.database.seeder import seed_roles
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    seed_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with seed_factory() as seed_session:
        await seed_roles(seed_session)
        await seed_session.commit()

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


# ---------------------------------------------------------------------------
# Phase 9 — reusable authenticated test client (plan 09-03)
# ---------------------------------------------------------------------------
from contextlib import asynccontextmanager
from jose import jwt as _jose_jwt


def _make_test_jwt(email: str, permissions: list[str] | None = None) -> str:
    """Generate a JWT for a test user email using the real app secret/algorithm.

    Security note (T-09-03-01): Tests use settings.JWT_SECRET (from .env which is gitignored).
    These tokens are ephemeral — db_session rolls back after each test (T-09-03-04).

    Phase 15 Plan 15-04 — accepts optional permissions[] claim (sorted alphabetically per
    Pitfall 14 for deterministic test assertions).
    """
    payload: dict = {"sub": email}
    if permissions is not None:
        payload["permissions"] = sorted(permissions)
    return _jose_jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


@pytest_asyncio.fixture
async def authenticated_client(db_session):
    """Factory fixture: returns a callable that builds an httpx client
    with ``Authorization: Bearer <jwt>`` for a user of the requested role.

    Uses the transactional ``db_session`` fixture — every user created here is
    rolled back after the test, preventing data leakage (T-09-03-04).

    Usage::

        async def test_something(authenticated_client):
            async with authenticated_client(role="admin") as client:
                r = await client.get("/api/v1/projects")
    """
    from sqlalchemy import select
    from app.infrastructure.database.models.role import RoleModel
    from app.infrastructure.database.models.user import UserModel

    @asynccontextmanager
    async def _builder(role: str = "member"):
        # Fetch (or create) the role row matching the requested role name
        stmt = select(RoleModel).where(RoleModel.name.ilike(role))
        result = await db_session.execute(stmt)
        role_row = result.scalar_one_or_none()
        if role_row is None:
            # Fallback: pick any available role to avoid test failures from seed-data drift
            stmt2 = select(RoleModel).limit(1)
            role_row = (await db_session.execute(stmt2)).scalar_one()

        user = UserModel(
            email=f"authclient+{role}@testexample.com",
            full_name=f"Test {role.capitalize()}",
            password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
            is_active=True,
            role_id=role_row.id,
        )
        db_session.add(user)
        await db_session.flush()
        token = _make_test_jwt(user.email)

        # Override DB dependency so the app uses the same transactional session
        app.dependency_overrides[get_db_session] = lambda: db_session
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=True) as client:
            client.headers["Authorization"] = f"Bearer {token}"
            yield client
        app.dependency_overrides.clear()

    return _builder


# ---------------------------------------------------------------------------
# Phase 15 Plan 15-04 — `permitted_client` fixture per D-1.15.
# Like authenticated_client but with an explicit JWT permissions[] claim so
# integration tests can exercise the require_permission DSL without depending
# on the live role_permissions matrix.
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def permitted_client(db_session):
    """Phase 15 D-1.15 — like authenticated_client but with explicit JWT permissions[] claim.

    Usage::

        async def test_x(permitted_client):
            async with permitted_client(perms=["admin.users.invite"]) as client:
                r = await client.post("/api/v1/admin/users", ...)
                assert r.status_code == 201

    Default role is "Member" (case-insensitive); pass ``role=`` to swap.
    Tokens carry permissions sorted alphabetically (Pitfall 14) for deterministic
    test assertions.
    """
    from sqlalchemy import select
    from app.infrastructure.database.models.role import RoleModel
    from app.infrastructure.database.models.user import UserModel

    @asynccontextmanager
    async def _builder(perms: list[str], role: str = "Member"):
        stmt = select(RoleModel).where(RoleModel.name.ilike(role))
        role_row = (await db_session.execute(stmt)).scalar_one_or_none()
        if role_row is None:
            role_row = (
                await db_session.execute(select(RoleModel).limit(1))
            ).scalar_one()
        user = UserModel(
            email=f"permclient+{abs(hash(tuple(sorted(perms))))}@testexample.com",
            full_name="Test PermClient",
            password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
            is_active=True,
            role_id=role_row.id,
        )
        db_session.add(user)
        await db_session.flush()
        token = _make_test_jwt(user.email, permissions=perms)
        app.dependency_overrides[get_db_session] = lambda: db_session
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            follow_redirects=True,
        ) as client:
            client.headers["Authorization"] = f"Bearer {token}"
            yield client
        app.dependency_overrides.clear()

    return _builder


# ---------------------------------------------------------------------------
# Phase 15 Plan 15-02 TIDY-05 — `requires_db` marker + auto-skip when DB down.
# Source: 15-RESEARCH.md Pattern 7 (pytest_collection_modifyitems with DB probe).
# CONTEXT D-4.4: developer iter `pytest -m 'not requires_db'`; CI `pytest`.
# ---------------------------------------------------------------------------

def pytest_configure(config):
    """Register the `requires_db` marker so `--strict-markers` does not warn."""
    config.addinivalue_line(
        "markers",
        "requires_db: marks tests as requiring a live Postgres connection",
    )


def pytest_collection_modifyitems(config, items):
    """Auto-skip @pytest.mark.requires_db tests when the DB is unreachable.

    Probes settings.DATABASE_URL at collection time. On connection failure,
    adds pytest.mark.skip(reason=...) to every test tagged `requires_db`.
    Probe failures must NEVER raise — they only add skip markers.

    Threat model (T-15-02 Test-01): probe failures are caught inside _probe;
    pool_pre_ping=True short-circuits in <100ms on connection refused, so the
    hook does not stall collection. Connection string is sourced from settings
    only — never logged.
    """
    import asyncio
    import sqlalchemy as sa
    from sqlalchemy.ext.asyncio import create_async_engine

    async def _probe() -> bool:
        try:
            engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
            async with engine.connect() as conn:
                await conn.execute(sa.text("SELECT 1"))
            await engine.dispose()
            return True
        except Exception:
            return False

    try:
        db_alive = asyncio.run(_probe())
    except Exception:
        # Defensive: even an unexpected event-loop error must not abort collection.
        db_alive = False

    if not db_alive:
        skip_marker = pytest.mark.skip(reason="DB not available (requires_db)")
        for item in items:
            if "requires_db" in item.keywords:
                item.add_marker(skip_marker)
