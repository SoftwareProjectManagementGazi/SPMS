import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock


# AUTH-03: Password Reset tests


@pytest.mark.asyncio
async def test_request_returns_204_for_existing_email():
    """RequestPasswordResetUseCase.execute() completes without raising for a known email."""
    from app.application.use_cases.request_password_reset import RequestPasswordResetUseCase
    from app.application.dtos.auth_dtos import PasswordResetRequestDTO
    from app.domain.entities.user import User

    user = User(id=1, email="user@example.com", password_hash="hash", full_name="Test", is_active=True)

    user_repo = AsyncMock()
    user_repo.get_by_email.return_value = user

    reset_repo = AsyncMock()
    reset_repo.create.return_value = MagicMock()

    use_case = RequestPasswordResetUseCase(user_repo, reset_repo)
    dto = PasswordResetRequestDTO(email="user@example.com")

    # Should not raise
    await use_case.execute(dto)

    reset_repo.create.assert_called_once()


@pytest.mark.asyncio
async def test_request_returns_204_for_nonexistent_email():
    """RequestPasswordResetUseCase.execute() completes without raising for unknown email (no enumeration)."""
    from app.application.use_cases.request_password_reset import RequestPasswordResetUseCase
    from app.application.dtos.auth_dtos import PasswordResetRequestDTO

    user_repo = AsyncMock()
    user_repo.get_by_email.return_value = None  # email not found

    reset_repo = AsyncMock()

    use_case = RequestPasswordResetUseCase(user_repo, reset_repo)
    dto = PasswordResetRequestDTO(email="unknown@example.com")

    # Should not raise — no user enumeration
    await use_case.execute(dto)

    # No token should be created for unknown email
    reset_repo.create.assert_not_called()


@pytest.mark.asyncio
async def test_token_expiry():
    """ConfirmPasswordResetUseCase raises HTTPException(400) for an expired token."""
    from fastapi import HTTPException
    from app.application.use_cases.confirm_password_reset import ConfirmPasswordResetUseCase
    from app.application.dtos.auth_dtos import PasswordResetConfirmDTO
    from app.domain.entities.password_reset_token import PasswordResetToken
    import hashlib

    raw_token = "sometoken"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    expired_record = PasswordResetToken(
        id=1,
        token_hash=token_hash,
        user_id=1,
        expires_at=datetime.utcnow() - timedelta(minutes=60),  # expired 1 hour ago
        used_at=None,
    )

    user_repo = AsyncMock()
    reset_repo = AsyncMock()
    reset_repo.get_by_hash.return_value = expired_record
    security = MagicMock()

    use_case = ConfirmPasswordResetUseCase(user_repo, reset_repo, security)
    dto = PasswordResetConfirmDTO(token=raw_token, new_password="NewPass123!")

    with pytest.raises(HTTPException) as exc_info:
        await use_case.execute(dto)

    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_token_single_use():
    """ConfirmPasswordResetUseCase raises HTTPException(400) for a token that was already used."""
    from fastapi import HTTPException
    from app.application.use_cases.confirm_password_reset import ConfirmPasswordResetUseCase
    from app.application.dtos.auth_dtos import PasswordResetConfirmDTO
    from app.domain.entities.password_reset_token import PasswordResetToken
    import hashlib

    raw_token = "sometoken"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    used_record = PasswordResetToken(
        id=1,
        token_hash=token_hash,
        user_id=1,
        expires_at=datetime.utcnow() + timedelta(minutes=30),
        used_at=datetime.utcnow() - timedelta(minutes=5),  # already used
    )

    user_repo = AsyncMock()
    reset_repo = AsyncMock()
    reset_repo.get_by_hash.return_value = used_record
    security = MagicMock()

    use_case = ConfirmPasswordResetUseCase(user_repo, reset_repo, security)
    dto = PasswordResetConfirmDTO(token=raw_token, new_password="NewPass123!")

    with pytest.raises(HTTPException) as exc_info:
        await use_case.execute(dto)

    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_confirm_updates_password():
    """Providing a valid reset token causes the user's password hash to be updated."""
    from app.application.use_cases.confirm_password_reset import ConfirmPasswordResetUseCase
    from app.application.dtos.auth_dtos import PasswordResetConfirmDTO
    from app.domain.entities.password_reset_token import PasswordResetToken
    import hashlib

    raw_token = "validtoken"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    valid_record = PasswordResetToken(
        id=1,
        token_hash=token_hash,
        user_id=1,
        expires_at=datetime.utcnow() + timedelta(minutes=30),
        used_at=None,
    )

    user_repo = AsyncMock()
    reset_repo = AsyncMock()
    reset_repo.get_by_hash.return_value = valid_record
    security = MagicMock()
    security.get_password_hash.return_value = "new_hashed_password"

    use_case = ConfirmPasswordResetUseCase(user_repo, reset_repo, security)
    dto = PasswordResetConfirmDTO(token=raw_token, new_password="NewPass123!")

    await use_case.execute(dto)

    user_repo.update_password.assert_called_once_with(1, "new_hashed_password")
    reset_repo.mark_used.assert_called_once_with(1)
