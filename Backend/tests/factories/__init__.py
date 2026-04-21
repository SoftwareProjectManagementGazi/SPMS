"""Test data factories for Phase 9 entities.

Each factory returns a domain entity (Pydantic model) with safe defaults.
Persist via: session.add(to_orm_model(entity)) + flush in the test itself.
"""
from tests.factories.user_factory import make_user
from tests.factories.project_factory import make_project
from tests.factories.team_factory import make_team
from tests.factories.process_template_factory import make_process_template
# Milestone/Artifact/PhaseReport factories will import gracefully only once entities exist
# (plans 09-05/06/07 add them). Keep these imports tolerant:
try:
    from tests.factories.milestone_factory import make_milestone  # noqa: F401
except ImportError:
    pass
try:
    from tests.factories.artifact_factory import make_artifact  # noqa: F401
except ImportError:
    pass
try:
    from tests.factories.phase_report_factory import make_phase_report  # noqa: F401
except ImportError:
    pass

__all__ = ["make_user", "make_project", "make_team", "make_process_template"]
