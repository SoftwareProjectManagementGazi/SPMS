from abc import ABC, abstractmethod
from typing import Dict, Optional


class ISystemConfigRepository(ABC):
    @abstractmethod
    async def get_all(self) -> Dict[str, str]: ...

    @abstractmethod
    async def get_by_key(self, key: str) -> Optional[str]: ...

    @abstractmethod
    async def upsert(self, key: str, value: str) -> None: ...

    @abstractmethod
    async def upsert_many(self, entries: Dict[str, str]) -> None: ...
