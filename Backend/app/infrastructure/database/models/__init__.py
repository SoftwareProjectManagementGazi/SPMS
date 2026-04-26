from .base import Base, TimestampedMixin
from .role import RoleModel
from .user import UserModel
from .project import ProjectModel
from .sprint import SprintModel
from .board_column import BoardColumnModel
from .task import TaskModel
from .comment import CommentModel
from .notification import NotificationModel
from .file import FileModel
from .label import LabelModel
from .audit_log import AuditLogModel
from app.infrastructure.database.models.process_template import ProcessTemplateModel  # noqa: F401
from app.infrastructure.database.models.team import TeamModel, TeamMemberModel, TeamProjectModel
from app.infrastructure.database.models.password_reset_token import PasswordResetTokenModel
from app.infrastructure.database.models.notification_preference import NotificationPreferenceModel
from app.infrastructure.database.models.task_watcher import TaskWatcherModel

# Phase 9 entity models — uncomment when implemented (plans 09-05, 09-06, 09-07):
from app.infrastructure.database.models.milestone import MilestoneModel  # noqa: F401
from app.infrastructure.database.models.artifact import ArtifactModel  # noqa: F401
from app.infrastructure.database.models.phase_report import PhaseReportModel  # noqa: F401

# Phase 14 Plan 14-01 — admin panel additions
from app.infrastructure.database.models.project_join_request import (  # noqa: F401
    ProjectJoinRequestModel,
)
