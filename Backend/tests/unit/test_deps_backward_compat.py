"""BACK-07 backward-compat: every legacy `from app.api.dependencies import X`
must continue to work, and must return the same object as `from app.api.deps.Y import X`."""
import pytest


# Test 1: Every expected legacy symbol importable from app.api.dependencies
LEGACY_SYMBOLS = [
    "oauth2_scheme", "get_db", "get_current_user", "_is_admin", "require_admin",
    "get_project_repo", "get_project_member",
    "get_task_repo", "get_task_project_member", "get_dependency_repo",
    "get_team_repo",
    "get_audit_repo",
    "get_sprint_repo", "get_sprint_project_member",
    "get_comment_repo",
    "get_attachment_repo",
    "get_board_column_repo",
    "get_notification_repo", "get_notification_preference_repo", "get_notification_service",
    "get_password_reset_repo",
    "get_process_template_repo",
    "get_system_config_repo",
    "get_report_repo",
    "get_user_repo",
    "get_security_service",
]


def test_legacy_symbols_still_importable():
    import app.api.dependencies as legacy
    missing = [s for s in LEGACY_SYMBOLS if not hasattr(legacy, s)]
    assert not missing, f"Legacy path broken: missing {missing}"


# Test 2: Legacy path and new path return the same object (proves re-export, not copy)
IDENTITY_CHECKS = [
    ("app.api.dependencies", "app.api.deps.auth", "get_current_user"),
    ("app.api.dependencies", "app.api.deps.auth", "require_admin"),
    ("app.api.dependencies", "app.api.deps.project", "get_project_repo"),
    ("app.api.dependencies", "app.api.deps.project", "get_project_member"),
    ("app.api.dependencies", "app.api.deps.task", "get_task_repo"),
    ("app.api.dependencies", "app.api.deps.task", "get_task_project_member"),
    ("app.api.dependencies", "app.api.deps.team", "get_team_repo"),
    ("app.api.dependencies", "app.api.deps.notification", "get_notification_service"),
]


@pytest.mark.parametrize("legacy_mod,new_mod,name", IDENTITY_CHECKS)
def test_legacy_symbol_is_same_object(legacy_mod, new_mod, name):
    import importlib
    legacy = importlib.import_module(legacy_mod)
    new = importlib.import_module(new_mod)
    assert getattr(legacy, name) is getattr(new, name), (
        f"{name}: legacy and new path return different objects"
    )


# Test 3: Package-level `from app.api.deps import X` works for every symbol
def test_package_aggregator_reexports_all():
    import app.api.deps as pkg
    missing = [s for s in LEGACY_SYMBOLS if not hasattr(pkg, s)]
    assert not missing, f"Package aggregator missing {missing}"


# Test 4: Existing routers still import successfully (main app smoke)
def test_main_app_imports_cleanly():
    # Importing main triggers all router imports; if any broke, this fails.
    import importlib, sys
    # Evict any cached module so we re-import fresh
    for mod_name in list(sys.modules.keys()):
        if mod_name.startswith("app.api"):
            sys.modules.pop(mod_name, None)
    mod = importlib.import_module("app.api.main")
    assert mod.app is not None


# Test 5: dependencies.py no longer contains function definitions
def test_dependencies_shim_has_no_function_defs():
    """After replacement, app.api.dependencies should be a shim with no def/async def."""
    import inspect
    import app.api.dependencies as legacy
    src = inspect.getsource(legacy)
    # Count function definitions in the source
    lines = src.split('\n')
    func_defs = [l for l in lines if l.startswith('def ') or l.startswith('async def ')]
    assert len(func_defs) == 0, (
        f"dependencies.py shim should not define any functions, found: {func_defs}"
    )
