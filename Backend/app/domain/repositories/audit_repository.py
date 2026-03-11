from abc import ABC, abstractmethod
from typing import Optional


class IAuditRepository(ABC):
    @abstractmethod
    async def create(
        self,
        entity_type: str,
        entity_id: int,
        field_name: str,
        old_value: Optional[str],
        new_value: Optional[str],
        user_id: Optional[int],
        action: str,
    ) -> None:
        pass

    @abstractmethod
    async def get_by_entity(self, entity_type: str, entity_id: int) -> list[dict]:
        """Return audit log entries for the given entity as a list of dicts.

        Each dict has keys: entity_type, entity_id, field_name, old_value,
        new_value, user_id, action, timestamp.
        """
        pass
