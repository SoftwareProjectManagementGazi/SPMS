from app.domain.interfaces.integration_service import IIntegrationService
from app.infrastructure.integrations.slack_integration_service import SlackIntegrationService
from app.infrastructure.integrations.teams_integration_service import TeamsIntegrationService

_REGISTRY = {
    "slack": SlackIntegrationService,
    "teams": TeamsIntegrationService,
}


def get_integration_service(platform: str, webhook_url: str) -> IIntegrationService:
    cls = _REGISTRY.get(platform.lower())
    if cls is None:
        raise ValueError(f"Unknown integration platform: {platform}")
    return cls(webhook_url)
