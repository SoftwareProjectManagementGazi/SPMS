import pytest
from app.infrastructure.database.repositories.user_repo import SqlAlchemyUserRepository
from app.domain.entities.user import User
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_create_and_get_user(db_session: AsyncSession):
    """
    Integration test for SqlAlchemyUserRepository.
    Verifies that a user can be created and retrieved using the real database.
    """
    repo = SqlAlchemyUserRepository(db_session)
    
    # Define a test user
    new_user = User(
        email="integration_test@example.com",
        password_hash="hashed_secret",
        full_name="Integration Tester",
        is_active=True
    )
    
    # 1. Create User
    created_user = await repo.create(new_user)
    
    assert created_user.id is not None
    assert created_user.email == new_user.email
    
    # 2. Get User by Email
    fetched_user = await repo.get_by_email("integration_test@example.com")
    
    assert fetched_user is not None
    assert fetched_user.id == created_user.id
    assert fetched_user.full_name == "Integration Tester"

@pytest.mark.asyncio
async def test_user_email_uniqueness(db_session: AsyncSession):
    """
    Verify that the database enforces unique emails (if constraint exists).
    This is a true integration test that mocks can miss.
    """
    repo = SqlAlchemyUserRepository(db_session)
    
    user1 = User(
        email="duplicate@example.com",
        password_hash="pass1",
        full_name="User One"
    )
    await repo.create(user1)
    
    user2 = User(
        email="duplicate@example.com",
        password_hash="pass2",
        full_name="User Two"
    )
    
    # Expecting an integrity error from the database
    from sqlalchemy.exc import IntegrityError
    
    with pytest.raises(IntegrityError):
        await repo.create(user2)
        # Flush needed to trigger the constraint within the transaction
        await db_session.flush()
