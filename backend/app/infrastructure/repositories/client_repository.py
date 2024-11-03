from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.infrastructure.db.orm.tables import Client
from app.api.schemas.client.client_schemas import CreateClientSchema, UpdateClientSchema, ReadClientSchema
from app.domain.interfaces.client.repository import AbstractClientRepository


class ClienteRepository(AbstractClientRepository):
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def create_client(self, client: CreateClientSchema) -> ReadClientSchema:
        new_client = Client(
            cli_dni=client.document,
            cli_nombre=client.name,
            cli_apellido=client.surname,
            cli_direccion=client.address,
            cli_correo=client.email,
            cli_celular=client.phone,
            cli_id_tipo=client.type_id,
        )
        self.db_session.add(new_client)
        try:
            await self.db_session.commit()
            await self.db_session.refresh(new_client)
            return ReadClientSchema.model_validate({
                'document': client.document,
                'name': client.name,
                'surname': client.surname,
                'address': client.address,
                'email': client.email,
                'phone': client.phone,
                'type_id': client.type_id,
            })
        except IntegrityError:
            await self.db_session.rollback()
        raise ValueError("El DNI ya existe en la base de datos.")

    async def get_client_by_id(self, cliente_id: int) -> Optional[ReadClientSchema]:
        query = select(Client).where(Client.cli_id == cliente_id)
        result = await self.db_session.execute(query)
        client = result.scalars().first()
        if client:
            return ReadClientSchema.model_validate({
                'document': client.cli_dni,
                'name': client.cli_nombre,
                'surname': client.cli_apellido,
                'address': client.cli_direccion,
                'email': client.cli_correo,
                'phone': client.cli_celular,
                'type_id': client.cli_id_tipo,
            })
        return None

    async def get_clients(self) -> List[ReadClientSchema]:
        query = select(Client)
        result = await self.db_session.execute(query)
        clients = result.scalars().all()

        return [
            ReadClientSchema.model_validate({
                'document': client.cli_dni,
                'name': client.cli_nombre,
                'surname': client.cli_apellido,
                'address': client.cli_direccion,
                'email': client.cli_correo,
                'phone': client.cli_celular,
                'type_id': client.cli_id_tipo,
            })
            for client in clients
        ]

    async def update_client(self, cliente_id: int, cliente_data: UpdateClientSchema) -> Optional[ReadClientSchema]:
        query = select(Client).where(Client.cli_id == cliente_id)
        result = await self.db_session.execute(query)
        client = result.scalars().first()

        if client:
            for key, value in cliente_data.dict(exclude_unset=True).items():
                setattr(client, f"cli_{key}", value)

            try:
                await self.db_session.commit()
                await self.db_session.refresh(client)
                return ReadClientSchema.model_validate({
                    'document': client.cli_dni,
                    'name': client.cli_nombre,
                    'surname': client.cli_apellido,
                    'address': client.cli_direccion,
                    'email': client.cli_correo,
                    'phone': client.cli_celular,
                    'type_id': client.cli_id_tipo,
                })
            except IntegrityError:
                await self.db_session.rollback()
                raise ValueError("Error al actualizar el cliente.")
        return None

    async def delete_client(self, cliente_id: int) -> bool:
        query = select(Client).where(Client.cli_id == cliente_id)
        result = await self.db_session.execute(query)
        client = result.scalars().first()
        if client:
            await self.db_session.delete(client)
            await self.db_session.commit()
            return True
        return False
