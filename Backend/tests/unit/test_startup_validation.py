"""
Unit tests for startup validation — hardcoded default secret detection.
"""
import pytest
from unittest.mock import patch, AsyncMock
from contextlib import asynccontextmanager


def _make_lifespan_with_settings(jwt_secret: str, db_password: str):
    """
    Helper that patches Settings values and returns the lifespan context manager
    from main.py so we can invoke it and observe RuntimeError.
    """
    import importlib
    import app.api.main as main_module

    async def _run():
        with patch("app.api.main.settings") as mock_settings:
            mock_settings.JWT_SECRET = jwt_secret
            mock_settings.DB_PASSWORD = db_password
            # We need to actually call the startup logic, not the full lifespan
            # because it also tries to seed the DB.
            # Instead test the validation function directly.
            from app.api.main import _validate_startup_secrets
            _validate_startup_secrets(mock_settings)

    return _run


def test_startup_raises_on_default_jwt_secret():
    """When JWT_SECRET == 'supersecretkey', startup validation raises RuntimeError."""
    from app.api.main import _validate_startup_secrets
    from unittest.mock import MagicMock

    mock_settings = MagicMock()
    mock_settings.JWT_SECRET = "supersecretkey"
    mock_settings.DB_PASSWORD = "safe_password_123"

    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        _validate_startup_secrets(mock_settings)


def test_startup_raises_on_default_db_password():
    """When DB_PASSWORD == 'secretpassword', startup validation raises RuntimeError."""
    from app.api.main import _validate_startup_secrets
    from unittest.mock import MagicMock

    mock_settings = MagicMock()
    mock_settings.JWT_SECRET = "safe_jwt_secret_abc123"
    mock_settings.DB_PASSWORD = "secretpassword"

    with pytest.raises(RuntimeError, match="DB_PASSWORD"):
        _validate_startup_secrets(mock_settings)


def test_startup_succeeds_with_secure_secrets():
    """No RuntimeError when both JWT_SECRET and DB_PASSWORD are non-default values."""
    from app.api.main import _validate_startup_secrets
    from unittest.mock import MagicMock

    mock_settings = MagicMock()
    mock_settings.JWT_SECRET = "safe_jwt_secret_abc123"
    mock_settings.DB_PASSWORD = "safe_db_password_xyz"

    # Should not raise
    _validate_startup_secrets(mock_settings)
