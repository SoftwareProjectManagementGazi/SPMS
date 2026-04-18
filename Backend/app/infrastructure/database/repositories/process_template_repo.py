from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.entities.process_template import ProcessTemplate
from app.domain.repositories.process_template_repository import IProcessTemplateRepository
from app.infrastructure.database.models.process_template import ProcessTemplateModel


class SqlAlchemyProcessTemplateRepository(IProcessTemplateRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_all(self) -> List[ProcessTemplate]:
        stmt = (
            select(ProcessTemplateModel)
            .order_by(
                ProcessTemplateModel.is_builtin.desc(),
                ProcessTemplateModel.name,
            )
        )
        result = await self._session.execute(stmt)
        rows = result.scalars().all()
        return [ProcessTemplate.model_validate(row) for row in rows]

    async def get_by_id(self, template_id: int) -> Optional[ProcessTemplate]:
        stmt = select(ProcessTemplateModel).where(ProcessTemplateModel.id == template_id)
        result = await self._session.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return ProcessTemplate.model_validate(row)

    async def get_by_name(self, name: str) -> Optional[ProcessTemplate]:
        stmt = select(ProcessTemplateModel).where(ProcessTemplateModel.name == name)
        result = await self._session.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return ProcessTemplate.model_validate(row)

    async def create(self, template: ProcessTemplate) -> ProcessTemplate:
        model = ProcessTemplateModel(
            name=template.name,
            is_builtin=False,
            columns=template.columns,
            recurring_tasks=template.recurring_tasks,
            behavioral_flags=template.behavioral_flags,
            description=template.description,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return ProcessTemplate.model_validate(model)

    async def update(self, template: ProcessTemplate) -> ProcessTemplate:
        stmt = select(ProcessTemplateModel).where(ProcessTemplateModel.id == template.id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            raise ValueError("Template not found")
        if template.name is not None:
            model.name = template.name
        if template.columns is not None:
            model.columns = template.columns
        if template.recurring_tasks is not None:
            model.recurring_tasks = template.recurring_tasks
        if template.behavioral_flags is not None:
            model.behavioral_flags = template.behavioral_flags
        if template.description is not None:
            model.description = template.description
        await self._session.flush()
        await self._session.refresh(model)
        return ProcessTemplate.model_validate(model)

    async def delete(self, template_id: int) -> None:
        stmt = select(ProcessTemplateModel).where(ProcessTemplateModel.id == template_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            raise ValueError("Template not found")
        await self._session.delete(model)
        await self._session.flush()
