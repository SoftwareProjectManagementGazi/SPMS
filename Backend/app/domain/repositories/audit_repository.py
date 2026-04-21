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

    @abstractmethod
    async def count_phase_transitions(self, project_id: int, source_phase_id: str) -> int:
        """D-25: count audit_log rows where action='phase_transition' AND entity_id=project_id
        AND extra_metadata->>'source_phase_id'=source_phase_id.
        Used for cycle_number auto-calculation on PhaseReport create.
        """
        pass

    @abstractmethod
    async def create_with_metadata(
        self,
        entity_type: str,
        entity_id: int,
        action: str,
        user_id: Optional[int],
        metadata: dict,
        field_name: str = "transition",
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
    ):
        """D-08: insert audit_log row with full JSON envelope in extra_metadata column.

        Note: DB column is literally `metadata`; Python attr is `extra_metadata` (Pitfall 7).
        """
        pass
