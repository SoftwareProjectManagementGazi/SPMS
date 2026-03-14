import pytest


# TASK-07: Sprint API endpoints — integration test stubs
# These tests will be implemented in a later plan.


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_get_sprints_by_project_returns_list():
    """GET /projects/{project_id}/sprints returns a list of sprints for the project."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_post_sprint_creates_sprint():
    """POST /projects/{project_id}/sprints creates a new sprint and returns 201."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_patch_sprint_updates_sprint():
    """PATCH /projects/{project_id}/sprints/{sprint_id} updates sprint fields and returns 200."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_delete_sprint_removes_sprint():
    """DELETE /projects/{project_id}/sprints/{sprint_id} removes the sprint and returns 204."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_sprint_requires_auth():
    """All sprint endpoints return 401 when no Authorization header is provided."""
    assert False, "not implemented"
