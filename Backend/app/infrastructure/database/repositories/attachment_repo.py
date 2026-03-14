from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.domain.entities.file import File
from app.domain.repositories.attachment_repository import IAttachmentRepository
from app.infrastructure.database.models.file import FileModel
from app.infrastructure.database.models.user import UserModel


class SqlAlchemyAttachmentRepository(IAttachmentRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _get_base_query(self):
        """Always filters out soft-deleted files and joinloads uploader info."""
        return (
            select(FileModel)
            .where(FileModel.is_deleted == False)
            .options(joinedload(FileModel.uploader))
        )

    def _to_entity(self, model: FileModel) -> File:
        return File(
            id=model.id,
            task_id=model.task_id,
            uploader_id=model.uploader_id,
            file_name=model.file_name,
            file_path=model.file_path,
            file_size=model.file_size,
            uploaded_at=model.uploaded_at,
            is_deleted=model.is_deleted,
            uploader=model.uploader,
        )

    async def get_by_id(self, file_id: int) -> Optional[File]:
        stmt = self._get_base_query().where(FileModel.id == file_id)
        result = await self.session.execute(stmt)
        model = result.unique().scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_task(self, task_id: int) -> List[File]:
        stmt = (
            self._get_base_query()
            .where(FileModel.task_id == task_id)
            .order_by(FileModel.uploaded_at)
        )
        result = await self.session.execute(stmt)
        models = result.unique().scalars().all()
        return [self._to_entity(m) for m in models]

    async def create(self, file: File) -> File:
        model = FileModel(
            task_id=file.task_id,
            uploader_id=file.uploader_id,
            file_name=file.file_name,
            file_path=file.file_path,
            file_size=file.file_size,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()

        # Re-fetch with uploader loaded
        stmt = (
            select(FileModel)
            .where(FileModel.id == model.id)
            .options(joinedload(FileModel.uploader))
        )
        result = await self.session.execute(stmt)
        refreshed = result.unique().scalar_one()
        return self._to_entity(refreshed)

    async def soft_delete(self, file_id: int) -> bool:
        stmt = select(FileModel).where(FileModel.id == file_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return False

        model.is_deleted = True
        await self.session.flush()
        await self.session.commit()
        return True
