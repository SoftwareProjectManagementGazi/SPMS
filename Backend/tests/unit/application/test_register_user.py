import pytest
from app.application.use_cases.register_user import RegisterUserUseCase
from app.application.dtos.auth_dtos import UserRegisterDTO
from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.application.ports.security_port import ISecurityService
from app.domain.exceptions import UserAlreadyExistsError
from typing import Optional

# --- Mocks (Test Doubles) ---

class MockUserRepository(IUserRepository):
    def __init__(self):
        self.users = {} # In-memory store
        self.next_id = 1

    async def get_by_email(self, email: str) -> Optional[User]:
        for user in self.users.values():
            if user.email == email:
                return user
        return None

    async def create(self, user: User) -> User:
        user.id = self.next_id
        self.users[self.next_id] = user
        self.next_id += 1
        return user

    async def get_by_id(self, user_id: int) -> Optional[User]:
        return self.users.get(user_id)

class MockSecurityService(ISecurityService):
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return plain_password == hashed_password.replace("hashed_", "")

    def get_password_hash(self, password: str) -> str:
        return f"hashed_{password}"

    def create_access_token(self, data: dict) -> str:
        return "mock_token"

# --- Tests ---

@pytest.mark.asyncio
async def test_register_user_success():
    # Arrange
    user_repo = MockUserRepository()
    security_service = MockSecurityService()
    use_case = RegisterUserUseCase(user_repo, security_service)
    
    dto = UserRegisterDTO(
        email="test@example.com",
        password="password123",
        full_name="Test User"
    )

    # Act
    result = await use_case.execute(dto)

    # Assert
    assert result.email == "test@example.com"
    assert result.id is not None
    # Verify persistence in mock
    saved_user = await user_repo.get_by_email("test@example.com")
    assert saved_user is not None
    assert saved_user.password_hash == "hashed_password123"

@pytest.mark.asyncio
async def test_register_user_already_exists():
    # Arrange
    user_repo = MockUserRepository()
    security_service = MockSecurityService()
    use_case = RegisterUserUseCase(user_repo, security_service)
    
    # Pre-populate
    existing_user = User(
        id=1,
        email="existing@example.com",
        password_hash="hashed_pw",
        full_name="Existing User"
    )
    user_repo.users[1] = existing_user

    dto = UserRegisterDTO(
        email="existing@example.com",
        password="newpassword",
        full_name="New Name"
    )

    # Act & Assert
    with pytest.raises(UserAlreadyExistsError):
        await use_case.execute(dto)
