import pytest


# AUTH-04: Account Lockout — xfail stubs
# These tests will be implemented in Plan 02-05.


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-04 not yet implemented", strict=False)
async def test_five_failed_attempts_locks_account():
    """Five consecutive failed login attempts cause the account to be locked; the 6th attempt returns HTTP 423."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-04 not yet implemented", strict=False)
async def test_counter_resets_on_success():
    """A successful login after partial failures resets the failed attempt counter to 0."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-04 not yet implemented", strict=False)
async def test_auto_unlock_after_15_minutes():
    """After an account is locked, it becomes accessible again after 15 minutes (use time mock)."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-04 not yet implemented", strict=False)
async def test_locked_response_includes_unlock_time():
    """The 423 response body contains the timestamp indicating when the lock expires."""
    assert False, "not implemented"


@pytest.mark.asyncio
@pytest.mark.xfail(reason="stub — AUTH-04 not yet implemented", strict=False)
async def test_correct_password_during_lockout_still_rejected():
    """Even a correct password is rejected while the account is in a locked state."""
    assert False, "not implemented"
