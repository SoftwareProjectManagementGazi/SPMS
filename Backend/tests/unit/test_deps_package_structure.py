"""BACK-07 Task 09-02-01: Tests for deps/ package structure.

RED phase: these tests MUST FAIL before the deps/ package exists.
GREEN phase: they PASS once all sub-modules are created.
"""
import pytest


# --- Test 1: auth sub-module imports ---
def test_auth_submodule_imports():
    """from app.api.deps.auth import oauth2_scheme, get_current_user, _is_admin, require_admin"""
    from app.api.deps.auth import oauth2_scheme, get_current_user, _is_admin, require_admin
    assert callable(get_current_user)
    assert callable(require_admin)
    assert callable(_is_admin)
    assert oauth2_scheme is not None


# --- Test 2: project sub-module imports ---
def test_project_submodule_imports():
    """from app.api.deps.project import get_project_repo, get_project_member"""
    from app.api.deps.project import get_project_repo, get_project_member
    assert callable(get_project_repo)
    assert callable(get_project_member)


# --- Test 3: task sub-module imports ---
def test_task_submodule_imports():
    """from app.api.deps.task import get_task_repo, get_task_project_member, get_dependency_repo"""
    from app.api.deps.task import get_task_repo, get_task_project_member, get_dependency_repo
    assert callable(get_task_repo)
    assert callable(get_task_project_member)
    assert callable(get_dependency_repo)


# --- Test 4: team, audit sub-module imports ---
def test_team_audit_submodule_imports():
    """from app.api.deps.team import get_team_repo; from app.api.deps.audit import get_audit_repo"""
    from app.api.deps.team import get_team_repo
    from app.api.deps.audit import get_audit_repo
    assert callable(get_team_repo)
    assert callable(get_audit_repo)


# --- Test 5: sprint sub-module imports ---
def test_sprint_submodule_imports():
    """from app.api.deps.sprint import get_sprint_repo, get_sprint_project_member"""
    from app.api.deps.sprint import get_sprint_repo, get_sprint_project_member
    assert callable(get_sprint_repo)
    assert callable(get_sprint_project_member)


# --- Test 6: other entity sub-modules ---
def test_other_entity_submodule_imports():
    from app.api.deps.comment import get_comment_repo
    from app.api.deps.attachment import get_attachment_repo
    from app.api.deps.board_column import get_board_column_repo
    from app.api.deps.notification import (
        get_notification_repo,
        get_notification_preference_repo,
        get_notification_service,
    )
    from app.api.deps.password_reset import get_password_reset_repo
    from app.api.deps.process_template import get_process_template_repo
    from app.api.deps.system_config import get_system_config_repo
    from app.api.deps.report import get_report_repo
    from app.api.deps.user import get_user_repo
    from app.api.deps.security import get_security_service
    assert callable(get_comment_repo)
    assert callable(get_attachment_repo)
    assert callable(get_board_column_repo)
    assert callable(get_notification_repo)
    assert callable(get_notification_preference_repo)
    assert callable(get_notification_service)
    assert callable(get_password_reset_repo)
    assert callable(get_process_template_repo)
    assert callable(get_system_config_repo)
    assert callable(get_report_repo)
    assert callable(get_user_repo)
    assert callable(get_security_service)


# --- Test 7: package-level re-exports ---
def test_package_level_reexports():
    """from app.api.deps import get_current_user (package-level re-export) works"""
    from app.api.deps import get_current_user, get_project_repo, get_task_repo, get_team_repo
    assert callable(get_current_user)
    assert callable(get_project_repo)
    assert callable(get_task_repo)
    assert callable(get_team_repo)


# --- Test 8: milestone/artifact/phase_report stubs exist (empty __all__) ---
def test_stub_submodules_exist():
    """Stub files exist and have empty __all__ (to be populated by plans 09-05/06/07)"""
    import app.api.deps.milestone as milestone_mod
    import app.api.deps.artifact as artifact_mod
    import app.api.deps.phase_report as phase_report_mod
    assert hasattr(milestone_mod, '__all__')
    assert hasattr(artifact_mod, '__all__')
    assert hasattr(phase_report_mod, '__all__')
    # All stubs have empty __all__ (will be populated later)
    assert milestone_mod.__all__ == []
    assert artifact_mod.__all__ == []
    assert phase_report_mod.__all__ == []


# --- Test 9: Each sub-module defines __all__ ---
def test_all_submodules_define_dunder_all():
    """Each sub-module defines __all__ listing its exported symbols"""
    import app.api.deps.auth as auth
    import app.api.deps.project as project
    import app.api.deps.task as task
    import app.api.deps.team as team
    import app.api.deps.audit as audit
    import app.api.deps.sprint as sprint
    import app.api.deps.comment as comment
    import app.api.deps.attachment as attachment
    import app.api.deps.board_column as board_column
    import app.api.deps.notification as notification
    import app.api.deps.password_reset as password_reset
    import app.api.deps.process_template as process_template
    import app.api.deps.system_config as system_config
    import app.api.deps.report as report
    import app.api.deps.user as user
    import app.api.deps.security as security

    for mod in [
        auth, project, task, team, audit, sprint, comment,
        attachment, board_column, notification, password_reset,
        process_template, system_config, report, user, security,
    ]:
        assert hasattr(mod, '__all__'), f"Module {mod.__name__} missing __all__"
        assert isinstance(mod.__all__, list), f"Module {mod.__name__} __all__ must be a list"
        assert len(mod.__all__) > 0, f"Module {mod.__name__} __all__ must not be empty"
