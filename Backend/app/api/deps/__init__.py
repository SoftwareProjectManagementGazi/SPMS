"""DI container split by entity. Back-compat: every symbol is re-exported
here so `from app.api.deps import X` works as a drop-in for the old
`from app.api.dependencies import X`."""
from app.api.deps.auth import *  # noqa: F401, F403
from app.api.deps.user import *  # noqa: F401, F403
from app.api.deps.project import *  # noqa: F401, F403
from app.api.deps.task import *  # noqa: F401, F403
from app.api.deps.team import *  # noqa: F401, F403
from app.api.deps.audit import *  # noqa: F401, F403
from app.api.deps.sprint import *  # noqa: F401, F403
from app.api.deps.comment import *  # noqa: F401, F403
from app.api.deps.attachment import *  # noqa: F401, F403
from app.api.deps.board_column import *  # noqa: F401, F403
from app.api.deps.notification import *  # noqa: F401, F403
from app.api.deps.password_reset import *  # noqa: F401, F403
from app.api.deps.process_template import *  # noqa: F401, F403
from app.api.deps.system_config import *  # noqa: F401, F403
from app.api.deps.report import *  # noqa: F401, F403
from app.api.deps.security import *  # noqa: F401, F403
# Phase 9 new entity deps (stubs populated by plans 09-05, 09-06, 09-07):
from app.api.deps.milestone import *  # noqa: F401, F403
from app.api.deps.artifact import *  # noqa: F401, F403
from app.api.deps.phase_report import *  # noqa: F401, F403
