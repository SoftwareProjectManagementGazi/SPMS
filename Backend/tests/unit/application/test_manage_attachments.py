import pytest


# TASK-03: Attachment Management — unit test stubs
# These tests will be implemented in a later plan.


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_upload_attachment_stores_file_and_returns_dto():
    """UploadAttachmentUseCase persists the file and returns an attachment DTO with file metadata."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_blocked_extension_raises_validation_error():
    """UploadAttachmentUseCase raises a validation error when the file extension is not allowed."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_file_exceeding_25mb_raises_validation_error():
    """UploadAttachmentUseCase raises a validation error when the file exceeds the 25 MB size limit."""
    assert False, "not implemented"


@pytest.mark.xfail(strict=False, reason="not implemented yet")
@pytest.mark.asyncio
async def test_download_attachment_returns_file_bytes():
    """DownloadAttachmentUseCase returns the raw file bytes for an existing attachment."""
    assert False, "not implemented"
