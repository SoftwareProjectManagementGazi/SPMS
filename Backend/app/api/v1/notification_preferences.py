from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import (
    get_current_user,
    get_notification_preference_repo,
)
from app.application.dtos.notification_dtos import (
    NotificationPreferenceDTO,
    NotificationPreferenceUpdateDTO,
)
from app.application.use_cases.manage_notifications import (
    GetNotificationPreferencesUseCase,
    UpdateNotificationPreferencesUseCase,
)
from app.domain.entities.user import User
from app.domain.repositories.notification_preference_repository import INotificationPreferenceRepository

router = APIRouter()

_VALID_DEADLINE_DAYS = {1, 2, 3, 7}


@router.get("/", response_model=NotificationPreferenceDTO)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    pref_repo: INotificationPreferenceRepository = Depends(get_notification_preference_repo),
):
    use_case = GetNotificationPreferencesUseCase(pref_repo)
    pref = await use_case.execute(user_id=current_user.id)  # type: ignore[arg-type]
    return NotificationPreferenceDTO.model_validate(pref)


@router.put("/", response_model=NotificationPreferenceDTO)
async def update_preferences(
    dto: NotificationPreferenceUpdateDTO,
    current_user: User = Depends(get_current_user),
    pref_repo: INotificationPreferenceRepository = Depends(get_notification_preference_repo),
):
    if dto.deadline_days is not None and dto.deadline_days not in _VALID_DEADLINE_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"deadline_days must be one of {sorted(_VALID_DEADLINE_DAYS)}",
        )
    use_case = UpdateNotificationPreferencesUseCase(pref_repo)
    pref = await use_case.execute(
        user_id=current_user.id,  # type: ignore[arg-type]
        dto=dto,
    )
    return NotificationPreferenceDTO.model_validate(pref)
