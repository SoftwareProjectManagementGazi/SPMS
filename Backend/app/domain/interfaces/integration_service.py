from abc import ABC, abstractmethod
from typing import Any, Dict


class IIntegrationService(ABC):
    @abstractmethod
    async def send_event(self, event_type: str, payload: Dict[str, Any]) -> bool:
        """Send event to external platform. Returns True on success, False on failure.
        Must never raise into caller (fire-and-forget semantics)."""
        ...
