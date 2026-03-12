import pytest


# AUTH-01 (avatar): Avatar Upload and Serving — xfail integration stubs
# These tests will be implemented in Plan 02-03.


@pytest.mark.xfail(reason="stub — AUTH-01 avatar not yet implemented", strict=False)
def test_avatar_upload_saves_file():
    """POST /auth/me/avatar with a valid image file returns 200 with the updated avatar path in the response."""
    assert False, "not implemented"


@pytest.mark.xfail(reason="stub — AUTH-01 avatar not yet implemented", strict=False)
def test_avatar_served_requires_auth():
    """GET /auth/avatar/{filename} without an Authorization token returns 401 Unauthorized."""
    assert False, "not implemented"


@pytest.mark.xfail(reason="stub — AUTH-01 avatar not yet implemented", strict=False)
def test_avatar_file_size_limit():
    """Uploading a file larger than 2MB returns 413 Request Entity Too Large."""
    assert False, "not implemented"
