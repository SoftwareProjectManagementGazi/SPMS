import pytest


# TASK-02: Comment Management — unit test stubs
# These tests will be implemented in a later plan.


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_create_comment_adds_comment_to_task():
    """CreateCommentUseCase adds a new comment to the specified task."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_list_comments_returns_task_comments():
    """ListCommentsUseCase returns all comments belonging to the given task."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_update_comment_by_author_succeeds():
    """UpdateCommentUseCase allows the comment author to edit their own comment."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_delete_comment_by_non_author_raises_forbidden():
    """DeleteCommentUseCase raises HTTP 403 when a non-author attempts to delete a comment."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_deleted_comment_not_returned_in_list():
    """A soft-deleted comment is excluded from the results returned by ListCommentsUseCase."""
    assert False, "not implemented"
