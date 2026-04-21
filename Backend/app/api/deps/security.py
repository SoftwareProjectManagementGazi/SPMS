"""Security service DI factory.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from app.application.ports.security_port import ISecurityService
from app.infrastructure.adapters.security_adapter import SecurityAdapter


def get_security_service() -> ISecurityService:
    return SecurityAdapter()


__all__ = ["get_security_service"]
