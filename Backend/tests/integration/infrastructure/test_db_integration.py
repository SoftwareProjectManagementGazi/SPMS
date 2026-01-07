import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_database_connection(db_session: AsyncSession):
    """
    Simple smoke test to verify database connection and query execution.
    """
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1

@pytest.mark.asyncio
async def test_table_creation(db_session: AsyncSession):
    """
    Verify that tables are created by checking if we can query the users table (even if empty).
    """
    # This assumes 'users' table name is defined in your UserModel. 
    # Adjust table name if different (e.g. via __tablename__).
    # Based on standard naming, likely 'users'.
    try:
        result = await db_session.execute(text("SELECT count(*) FROM users"))
        assert result.scalar() >= 0
    except Exception as e:
        pytest.fail(f"Could not query users table. Tables might not be created. Error: {e}")
