from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from app.application.ports.security_port import ISecurityService
from app.infrastructure.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class SecurityAdapter(ISecurityService):
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt
