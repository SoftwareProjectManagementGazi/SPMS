import pytest


# AUTH-01: Update User Profile — xfail stubs
# These tests will be implemented in Plan 02-03.


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-01 not yet implemented", strict=False)
async def test_update_full_name_success():
    """UpdateUserProfileUseCase updates full_name and returns updated user."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-01 not yet implemented", strict=False)
async def test_update_email_without_current_password_raises():
    """Raises an error if email is included in the update but current_password is not provided."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-01 not yet implemented", strict=False)
async def test_email_change_requires_password():
    """If email is included in the update, current_password must match the stored hash before the update proceeds."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-01 not yet implemented", strict=False)
async def test_update_avatar_path_saved():
    """Avatar path is stored as a relative path (e.g. 'uploads/avatars/uuid.jpg'), not an absolute path."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-01 not yet implemented", strict=False)
async def test_update_nonexistent_user_raises():
    """Raises a 404-style exception when user_id is not found in the repository."""
    assert False, "not implemented"
