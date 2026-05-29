"""AUTH-01 (avatar): real integration tests for the avatar endpoints.

Replaces the previous ``xfail(strict=False) + assert False`` stubs (flagged as
fake passes by the test audit). These drive the real ``/api/v1/auth`` endpoints
against the test DB.

The relative-path assertion below is the genuine home of the behaviour the old
unit test ``test_update_user_profile.py::test_update_avatar_path_saved``
pretended to check — ``UpdateUserProfileUseCase`` never touched avatars; the
``POST /auth/me/avatar`` router endpoint constructs and persists the path.
"""
import pytest

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db

# The endpoint validates by file extension, not by image content, so a small
# byte blob with a .png name is sufficient to exercise the happy path.
_PNG = b"\x89PNG\r\n\x1a\n" + b"\0" * 64


@pytest.mark.asyncio
async def test_avatar_served_requires_auth(client):
    """GET /auth/avatar/{filename} without an Authorization token returns 401."""
    r = await client.get("/api/v1/auth/avatar/whatever.png")
    # kills mutation: dropping Depends(get_current_user) would yield 404, not 401.
    assert r.status_code == 401, r.text


@pytest.mark.asyncio
async def test_avatar_upload_stores_relative_path(authenticated_client, monkeypatch, tmp_path):
    """POST /auth/me/avatar saves the file and persists a RELATIVE path."""
    import app.api.v1.auth as auth_module

    monkeypatch.setattr(auth_module, "AVATAR_DIR", tmp_path / "avatars")

    async with authenticated_client(role="member") as client:
        r = await client.post(
            "/api/v1/auth/me/avatar",
            files={"file": ("pic.png", _PNG, "image/png")},
        )
        assert r.status_code == 200, r.text
        avatar = r.json()["avatar"]

    # The stored path must be RELATIVE (kills mutation: storing os.path.abspath(...)).
    assert avatar is not None
    assert avatar.startswith("uploads/avatars/")
    assert not avatar.startswith("/")
    assert ":" not in avatar  # no 'C:\\...' absolute Windows path
    # The bytes were actually written under the (patched) avatar dir.
    written = (tmp_path / "avatars") / avatar.split("/")[-1]
    assert written.exists()
    assert written.read_bytes() == _PNG


@pytest.mark.asyncio
async def test_avatar_upload_rejects_disallowed_extension(authenticated_client, monkeypatch, tmp_path):
    """A non-image extension (.exe) is rejected with 400 before anything is written."""
    import app.api.v1.auth as auth_module

    monkeypatch.setattr(auth_module, "AVATAR_DIR", tmp_path / "avatars")
    async with authenticated_client(role="member") as client:
        r = await client.post(
            "/api/v1/auth/me/avatar",
            files={"file": ("evil.exe", b"MZ", "application/octet-stream")},
        )
    assert r.status_code == 400, r.text


@pytest.mark.asyncio
async def test_avatar_file_size_limit(authenticated_client, monkeypatch, tmp_path):
    """Uploading a file larger than 2MB returns 413."""
    import app.api.v1.auth as auth_module

    monkeypatch.setattr(auth_module, "AVATAR_DIR", tmp_path / "avatars")
    oversized = b"\0" * (auth_module.MAX_AVATAR_SIZE + 1)
    async with authenticated_client(role="member") as client:
        r = await client.post(
            "/api/v1/auth/me/avatar",
            files={"file": ("big.png", oversized, "image/png")},
        )
    # kills mutation: removing the 2MB guard would accept it (200).
    assert r.status_code == 413, r.text
