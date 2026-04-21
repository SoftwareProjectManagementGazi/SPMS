"""LEGACY import path for DI container. All symbols now live under `app.api.deps.*`.

This file preserves backward compatibility for code that imports from
`app.api.dependencies`. New code should import from `app.api.deps.<entity>` directly.

Split per D-31 / BACK-07 (Phase 9).
"""
from app.api.deps import *  # noqa: F401, F403

# Also re-export names that users of this module historically relied on even
# if they are not in `__all__` of sub-modules (belt-and-suspenders):
from app.api.deps.auth import (  # noqa: F401
    oauth2_scheme,
    get_db,
    get_current_user,
    _is_admin,
    require_admin,
    require_project_transition_authority,
)
from app.api.deps.project import get_project_repo, get_project_member  # noqa: F401
from app.api.deps.task import get_task_repo, get_task_project_member, get_dependency_repo  # noqa: F401
from app.api.deps.team import get_team_repo  # noqa: F401
from app.api.deps.audit import get_audit_repo  # noqa: F401
from app.api.deps.sprint import get_sprint_repo, get_sprint_project_member  # noqa: F401
from app.api.deps.comment import get_comment_repo  # noqa: F401
from app.api.deps.attachment import get_attachment_repo  # noqa: F401
from app.api.deps.board_column import get_board_column_repo  # noqa: F401
from app.api.deps.notification import (  # noqa: F401
    get_notification_repo,
    get_notification_preference_repo,
    get_notification_service,
)
from app.api.deps.password_reset import get_password_reset_repo  # noqa: F401
from app.api.deps.process_template import get_process_template_repo  # noqa: F401
from app.api.deps.system_config import get_system_config_repo  # noqa: F401
from app.api.deps.report import get_report_repo  # noqa: F401
from app.api.deps.user import get_user_repo  # noqa: F401
from app.api.deps.security import get_security_service  # noqa: F401
from app.api.deps.artifact import get_artifact_repo  # noqa: F401
from app.api.deps.phase_report import get_phase_report_repo  # noqa: F401
