from abc import ABC, abstractmethod

class ISecurityService(ABC):
    @abstractmethod
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        pass

    @abstractmethod
    def get_password_hash(self, password: str) -> str:
        pass

    @abstractmethod
    def create_access_token(self, data: dict) -> str:
        pass
