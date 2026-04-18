import httpx
import logging
from typing import Any, Dict
from app.domain.interfaces.integration_service import IIntegrationService

logger = logging.getLogger(__name__)


class TeamsIntegrationService(IIntegrationService):
    def __init__(self, webhook_url: str):
        self._webhook_url = webhook_url

    async def send_event(self, event_type: str, payload: Dict[str, Any]) -> bool:
        try:
            message = payload.get("message", "")
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    self._webhook_url,
                    json={
                        "@type": "MessageCard",
                        "@context": "http://schema.org/extensions",
                        "summary": event_type,
                        "text": message,
                    }
                )
                return resp.status_code == 200
        except Exception as e:
            logger.warning(f"Teams integration failed for {event_type}: {e}")
            return False
