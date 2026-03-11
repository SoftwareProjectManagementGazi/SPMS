"""
Unit tests for startup validation — hardcoded default secret detection.

All tests are marked xfail — stubs for Nyquist compliance.
Implementation is pending Plan 01-02 (startup crash on insecure defaults).
"""
import pytest


@pytest.mark.xfail(reason="pending implementation in 01-02 — startup validation not yet enforced")
def test_startup_raises_on_default_jwt_secret():
    """When JWT_SECRET == 'supersecretkey', app raises RuntimeError at startup."""
    # Stub: will import settings validation logic and assert RuntimeError
    raise NotImplementedError("Startup JWT secret validation not yet implemented")


@pytest.mark.xfail(reason="pending implementation in 01-02 — startup validation not yet enforced")
def test_startup_raises_on_default_db_password():
    """When DB_PASSWORD == 'secretpassword', app raises RuntimeError at startup."""
    # Stub: will import settings validation logic and assert RuntimeError
    raise NotImplementedError("Startup DB password validation not yet implemented")


@pytest.mark.xfail(reason="pending implementation in 01-02 — startup validation not yet enforced")
def test_startup_succeeds_with_secure_secrets():
    """No RuntimeError when both JWT_SECRET and DB_PASSWORD are non-default values."""
    # Stub: will construct Settings with secure values and assert no exception
    raise NotImplementedError("Startup validation not yet implemented")
