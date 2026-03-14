import pytest


# TASK-09: Attachments API endpoints — integration test stubs
# These tests will be implemented in a later plan.


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_post_attachment_uploads_file():
    """POST /tasks/{task_id}/attachments uploads a file and returns 201 with attachment metadata."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_get_attachment_download_returns_file():
    """GET /attachments/{attachment_id}/download returns the file bytes with the correct content type."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_post_blocked_extension_returns_400():
    """POST /tasks/{task_id}/attachments returns 400 when the uploaded file has a blocked extension."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
def test_post_oversized_file_returns_413():
    """POST /tasks/{task_id}/attachments returns 413 when the uploaded file exceeds the 25 MB limit."""
    assert False, "not implemented"
