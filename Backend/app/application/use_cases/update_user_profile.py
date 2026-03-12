from typing import Optional
from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.application.dtos.auth_dtos import UserUpdateDTO
from app.application.ports.security_port import ISecurityService
from fastapi import HTTPException


class UpdateUserProfileUseCase:
    def __init__(self, user_repo: IUserRepository, security_service: ISecurityService):
        self._user_repo = user_repo
        self._security = security_service

    async def execute(self, current_user: User, dto: UserUpdateDTO) -> Optional[User]:
        if dto.email is not None:
            # Email change requires current password confirmation
            if not dto.current_password:
                raise HTTPException(
                    status_code=400,
                    detail="current_password required to change email",
                )
            if not self._security.verify_password(dto.current_password, current_user.password_hash):
                raise HTTPException(
                    status_code=401,
                    detail="Current password is incorrect",
                )

        update_fields = {}
        if dto.full_name is not None:
            update_fields["full_name"] = dto.full_name
        if dto.email is not None:
            update_fields["email"] = dto.email

        if update_fields:
            await self._user_repo.update(current_user.id, update_fields)

        return await self._user_repo.get_by_id(current_user.id)
