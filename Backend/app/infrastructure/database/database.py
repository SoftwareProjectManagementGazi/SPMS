from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.infrastructure.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True, # Set to False in production
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
