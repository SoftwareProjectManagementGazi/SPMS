"""Plan 15-02 TIDY-05 — smoke tests for the requires_db marker auto-skip.

When DB is up:
  - Both tests run. The first asserts the marker is registered with pytest;
    the second is tagged `@pytest.mark.requires_db` and runs because the
    conftest probe succeeded.

When DB is down:
  - The first test still runs (marker registration is global).
  - The second test is auto-skipped by the conftest pytest_collection_modifyitems
    hook (CONTEXT D-4.4) — verified manually by stopping Postgres.

Source: 15-RESEARCH.md Pattern 7 (pytest_collection_modifyitems + DB probe).
CONTEXT D-4.4 quality bar: this file IS the marker behavior smoke test;
it intentionally does NOT depend on db_session — only on pytestconfig and
the marker tag itself.
"""
import pytest


def test_requires_db_marker_is_registered(pytestconfig):
    """pytest_configure must register the requires_db marker.

    Asserts that conftest.pytest_configure() called config.addinivalue_line(
    "markers", "requires_db: ..."). Reading getini("markers") returns the
    list of marker definitions; we look for the one starting with "requires_db".
    """
    markers = [m for m in pytestconfig.getini("markers") if m.startswith("requires_db")]
    assert len(markers) == 1, f"requires_db marker not registered: {markers}"


@pytest.mark.requires_db
def test_marker_can_be_applied():
    """Smoke: a test tagged @requires_db must be collectable and runnable.

    When DB up, this assertion succeeds.
    When DB down, conftest.pytest_collection_modifyitems auto-skips it.
    """
    assert True
