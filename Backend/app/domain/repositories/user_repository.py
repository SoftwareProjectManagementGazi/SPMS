from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.entities.user import User

class IUserRepository(ABC):
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        pass

    @abstractmethod
    async def create(self, user: User) -> User:
        pass
    
    @abstractmethod
    async def get_by_id(self, user_id: int) -> Optional[User]:
        pass

    @abstractmethod
    async def update_password(self, user_id: int, password_hash: str) -> None:
        pass

    @abstractmethod
    async def search_by_email_or_name(self, query: str) -> List[User]:
        pass
