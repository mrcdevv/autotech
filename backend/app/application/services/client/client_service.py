from typing import List, Optional
from app.domain.interfaces.client.repository import AbstractClientRepository
from app.api.schemas.client.client_schemas import CreateClientSchema, UpdateClientSchema, ReadClientSchema

class ClientService:
    def __init__(self, cliente_repo: AbstractClientRepository):
        self.cliente_repo = cliente_repo

    async def create_client(self, cliente_data: CreateClientSchema) -> ReadClientSchema:
        try:
            return await self.cliente_repo.create_client(cliente_data)
        except ValueError as e:
            raise ValueError(f"Error al crear el cliente: {e}")

    async def get_client_by_id(self, cliente_id: int) -> Optional[ReadClientSchema]:
        client = await self.cliente_repo.get_client_by_id(cliente_id)
        if client is None:
            raise ValueError(f"Cliente con ID {cliente_id} no encontrado.")
        return client

    async def get_clients(self) -> List[ReadClientSchema]:
        return await self.cliente_repo.get_clients()

    async def update_client(self, cliente_id: int, cliente_data: UpdateClientSchema) -> Optional[ReadClientSchema]:
        try:
            updated_client = await self.cliente_repo.update_client(cliente_id, cliente_data)
            if updated_client is None:
                raise ValueError(f"Cliente con ID {cliente_id} no encontrado para actualizar.")
            return updated_client
        except ValueError as e:
            raise ValueError(f"Error al actualizar el cliente: {e}")

    async def delete_client(self, cliente_id: int) -> bool:
        deleted_client = await self.cliente_repo.delete_client(cliente_id)
        if not deleted_client:
            raise ValueError(f"Cliente con ID {cliente_id} no encontrado para eliminar.")
        return deleted_client
