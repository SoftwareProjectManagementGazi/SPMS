import pytest


# SEC-01: Rate Limiting — xfail integration stubs
# These tests will be implemented in Plan 02-05.


@pytest.mark.xfail(reason="stub — SEC-01 not yet implemented", strict=False)
def test_login_rate_limit_429_after_10_requests():
    """Sending 11 POST /auth/login requests in sequence yields a 429 Too Many Requests response."""
    assert False, "not implemented"


@pytest.mark.xfail(reason="stub — SEC-01 not yet implemented", strict=False)
def test_register_rate_limit_429_after_5_requests():
    """Sending 6 POST /auth/register requests in sequence yields a 429 Too Many Requests response."""
    assert False, "not implemented"
