from abc import ABC, abstractmethod
from typing import List, Optional
from app.api.schemas.client.client_schemas import CreateClientSchema, UpdateClientSchema, ReadClientSchema


class AbstractClientRepository(ABC):

    @abstractmethod
    async def create_client(self, cliente: CreateClientSchema) -> ReadClientSchema:
        pass

    @abstractmethod
    async def get_client_by_id(self, cliente_id: int) -> Optional[ReadClientSchema]:
        pass

    @abstractmethod
    async def get_clients(self) -> List[ReadClientSchema]:
        pass

    @abstractmethod
    async def update_client(self, cliente_id: int, cliente: UpdateClientSchema) -> Optional[ReadClientSchema]:
        pass

    @abstractmethod
    async def delete_client(self, cliente_id: int) -> bool:
        pass
