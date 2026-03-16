from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import (
    get_current_user,
    get_notification_repo,
    get_notification_service,
)
from app.application.dtos.notification_dtos import NotificationListResponseDTO
from app.application.use_cases.manage_notifications import (
    ClearReadNotificationsUseCase,
    DeleteNotificationUseCase,
    ListUserNotificationsUseCase,
    MarkAllReadUseCase,
    MarkNotificationReadUseCase,
)
from app.domain.entities.user import User
from app.domain.repositories.notification_repository import INotificationRepository

router = APIRouter()


# NOTE: Fixed-path routes must appear before parametric routes to avoid
# FastAPI treating "mark-all-read" or "clear-read" as a path param value.


@router.get("/", response_model=NotificationListResponseDTO)
async def list_notifications(
    unread_only: bool = False,
    limit: int = Query(20, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repo),
):
    use_case = ListUserNotificationsUseCase(notification_repo)
    return await use_case.execute(
        user_id=current_user.id,  # type: ignore[arg-type]
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repo),
):
    use_case = MarkAllReadUseCase(notification_repo)
    await use_case.execute(user_id=current_user.id)  # type: ignore[arg-type]
    return {"message": "Tüm bildirimler okundu olarak işaretlendi"}


@router.delete("/clear-read")
async def clear_read_notifications(
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repo),
):
    use_case = ClearReadNotificationsUseCase(notification_repo)
    await use_case.execute(user_id=current_user.id)  # type: ignore[arg-type]
    return {"message": "Okunmuş bildirimler temizlendi"}


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repo),
):
    use_case = MarkNotificationReadUseCase(notification_repo)
    try:
        await use_case.execute(
            notification_id=notification_id,
            user_id=current_user.id,  # type: ignore[arg-type]
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bildirim bulunamadı",
        )
    return {"message": "Bildirim okundu olarak işaretlendi"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    notification_repo: INotificationRepository = Depends(get_notification_repo),
):
    use_case = DeleteNotificationUseCase(notification_repo)
    try:
        await use_case.execute(
            notification_id=notification_id,
            user_id=current_user.id,  # type: ignore[arg-type]
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bildirim bulunamadı",
        )
    return {"message": "Bildirim silindi"}
