from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.dependencies import get_current_user
from app.domain.entities.user import User
from app.infrastructure.integrations.integration_factory import get_integration_service

router = APIRouter()


class WebhookTestDTO(BaseModel):
    platform: str  # "slack" or "teams"
    webhook_url: str


@router.post("/test", status_code=status.HTTP_200_OK)
async def test_webhook(
    dto: WebhookTestDTO,
    user: User = Depends(get_current_user),  # Any authenticated user (PM can test their own project webhook)
):
    try:
        svc = get_integration_service(dto.platform, dto.webhook_url)
        success = await svc.send_event(
            "test",
            {"message": "\U0001f514 SPMS baglanti testi basarili!"}
        )
        if success:
            return {"status": "success", "message": "Baglanti basarili!"}
        else:
            return {"status": "failure", "message": "Baglanti basarisiz. URL'yi kontrol edin."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
