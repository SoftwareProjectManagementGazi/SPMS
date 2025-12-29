from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    DB_USER: str = "admin"
    DB_PASSWORD: str = "secretpassword"
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "spms_db"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
