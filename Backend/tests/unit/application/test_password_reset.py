import pytest


# AUTH-03: Password Reset — xfail stubs
# These tests will be implemented in Plan 02-05.


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-03 not yet implemented", strict=False)
async def test_request_returns_204_for_existing_email():
    """Password reset request endpoint always returns 204 (no enumeration), even for known emails."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-03 not yet implemented", strict=False)
async def test_request_returns_204_for_nonexistent_email():
    """Password reset request endpoint always returns 204, even when email is not in the database."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-03 not yet implemented", strict=False)
async def test_token_expiry():
    """A reset token older than 30 minutes is rejected with a 400 error."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-03 not yet implemented", strict=False)
async def test_token_single_use():
    """A reset token that has already been used cannot be used again (used_at is set on first use)."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-03 not yet implemented", strict=False)
async def test_confirm_updates_password():
    """Providing a valid reset token causes the user's password hash to be updated in the repository."""
    assert False, "not implemented"
