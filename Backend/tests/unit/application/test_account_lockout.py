import pytest
from datetime import datetime, timedelta


# AUTH-04: Account Lockout tests


def _reset_store(user_id: int):
    """Helper to clear lockout store between tests."""
    from app.application.services.lockout import _lockout_store
    _lockout_store.pop(user_id, None)


def test_five_failed_attempts_locks_account():
    """Five consecutive failed login attempts lock the account; check_lockout returns a datetime."""
    from app.application.services.lockout import record_failed_attempt, check_lockout, _lockout_store
    user_id = 9001
    _lockout_store.pop(user_id, None)

    for i in range(5):
        record_failed_attempt(user_id)

    locked_until = check_lockout(user_id)
    assert locked_until is not None, "Account should be locked after 5 failed attempts"
    assert isinstance(locked_until, datetime)


def test_counter_resets_on_success():
    """clear_lockout removes the lockout entry; subsequent check_lockout returns None."""
    from app.application.services.lockout import record_failed_attempt, check_lockout, clear_lockout, _lockout_store
    user_id = 9002
    _lockout_store.pop(user_id, None)

    for i in range(5):
        record_failed_attempt(user_id)

    assert check_lockout(user_id) is not None

    clear_lockout(user_id)
    assert check_lockout(user_id) is None


def test_auto_unlock_after_15_minutes():
    """An entry with locked_until in the past is treated as unlocked."""
    from app.application.services.lockout import check_lockout, _lockout_store, LockoutEntry
    user_id = 9003
    _lockout_store[user_id] = LockoutEntry(
        attempts=5,
        locked_until=datetime.utcnow() - timedelta(minutes=1),  # expired 1 min ago
    )

    result = check_lockout(user_id)
    assert result is None, "Expired lock should auto-unlock"


def test_locked_response_includes_unlock_time():
    """check_lockout returns the locked_until datetime so the API can include it in the 423 response."""
    from app.application.services.lockout import record_failed_attempt, check_lockout, _lockout_store
    user_id = 9004
    _lockout_store.pop(user_id, None)

    for i in range(5):
        record_failed_attempt(user_id)

    locked_until = check_lockout(user_id)
    assert locked_until is not None
    # Should be approximately 15 minutes from now
    delta = locked_until - datetime.utcnow()
    assert 13 * 60 < delta.total_seconds() < 16 * 60, "Lock should be ~15 minutes"


def test_correct_password_during_lockout_still_rejected():
    """check_lockout returns a datetime even if called with a correct password — the lock is unconditional."""
    from app.application.services.lockout import record_failed_attempt, check_lockout, _lockout_store
    user_id = 9005
    _lockout_store.pop(user_id, None)

    for i in range(5):
        record_failed_attempt(user_id)

    # Regardless of whether password would be correct, lockout prevents access
    locked_until = check_lockout(user_id)
    assert locked_until is not None, "Locked account should be rejected even with correct password"
