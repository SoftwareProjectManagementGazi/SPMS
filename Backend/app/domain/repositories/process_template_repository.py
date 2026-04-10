from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.process_template import ProcessTemplate


class IProcessTemplateRepository(ABC):
    @abstractmethod
    async def get_all(self) -> List[ProcessTemplate]: ...

    @abstractmethod
    async def get_by_id(self, template_id: int) -> Optional[ProcessTemplate]: ...

    @abstractmethod
    async def get_by_name(self, name: str) -> Optional[ProcessTemplate]: ...

    @abstractmethod
    async def create(self, template: ProcessTemplate) -> ProcessTemplate: ...

    @abstractmethod
    async def update(self, template: ProcessTemplate) -> ProcessTemplate: ...

    @abstractmethod
    async def delete(self, template_id: int) -> None: ...
