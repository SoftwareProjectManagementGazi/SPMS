from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from fastapi import BackgroundTasks
from app.infrastructure.config import settings
from pathlib import Path
from typing import Dict, Any


def _get_mail_config() -> ConnectionConfig:
    return ConnectionConfig(
        MAIL_USERNAME=settings.SMTP_USER,
        MAIL_PASSWORD=settings.SMTP_PASSWORD,
        MAIL_FROM=settings.SMTP_FROM,
        MAIL_PORT=settings.SMTP_PORT,
        MAIL_SERVER=settings.SMTP_HOST,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        TEMPLATE_FOLDER=Path(__file__).parent / "templates",
    )


async def send_notification_email(
    background_tasks: BackgroundTasks,
    to_email: str,
    subject: str,
    template_name: str,
    body: Dict[str, Any],
) -> None:
    """Non-blocking email send via BackgroundTasks. Silently skips if SMTP not configured."""
    if not settings.SMTP_HOST:
        return
    mail = FastMail(_get_mail_config())
    message = MessageSchema(
        subject=subject,
        recipients=[to_email],
        template_body=body,
        subtype=MessageType.html,
    )
    background_tasks.add_task(mail.send_message, message, template_name=template_name)
