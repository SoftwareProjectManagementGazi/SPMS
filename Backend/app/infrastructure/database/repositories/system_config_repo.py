from typing import Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.sql import func

from app.domain.repositories.system_config_repository import ISystemConfigRepository
from app.infrastructure.database.models.system_config import SystemConfigModel


class SqlAlchemySystemConfigRepository(ISystemConfigRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_all(self) -> Dict[str, str]:
        stmt = select(SystemConfigModel)
        result = await self._session.execute(stmt)
        rows = result.scalars().all()
        return {row.key: row.value for row in rows}

    async def get_by_key(self, key: str) -> Optional[str]:
        stmt = select(SystemConfigModel).where(SystemConfigModel.key == key)
        result = await self._session.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return row.value

    async def upsert(self, key: str, value: str) -> None:
        stmt = pg_insert(SystemConfigModel).values(key=key, value=value)
        stmt = stmt.on_conflict_do_update(
            index_elements=["key"],
            set_={"value": value, "updated_at": func.now()},
        )
        await self._session.execute(stmt)
        await self._session.flush()

    async def upsert_many(self, entries: Dict[str, str]) -> None:
        for key, value in entries.items():
            stmt = pg_insert(SystemConfigModel).values(key=key, value=value)
            stmt = stmt.on_conflict_do_update(
                index_elements=["key"],
                set_={"value": value, "updated_at": func.now()},
            )
            await self._session.execute(stmt)
        await self._session.flush()
