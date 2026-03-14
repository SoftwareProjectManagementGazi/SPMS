import pytest


# TASK-08: Comments API endpoints — integration test stubs
# These tests will be implemented in a later plan.


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_get_comments_by_task_returns_list():
    """GET /tasks/{task_id}/comments returns a list of comments for the task."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_post_comment_creates_comment():
    """POST /tasks/{task_id}/comments creates a new comment and returns 201."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_patch_comment_updates_comment_by_author():
    """PATCH /comments/{comment_id} updates a comment when requested by the comment author."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_delete_comment_by_author_removes_comment():
    """DELETE /comments/{comment_id} removes a comment when requested by the comment author."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_patch_comment_by_non_author_returns_403():
    """PATCH /comments/{comment_id} returns 403 when the requester is not the comment author."""
    assert False, "not implemented"
