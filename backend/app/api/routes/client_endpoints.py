from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.schemas.client.client_schemas import CreateClientSchema, UpdateClientSchema, ReadClientSchema
from app.application.services.client.client_service import ClientService
from app.infrastructure.repositories.client_repository import ClienteRepository
from app.infrastructure.db.orm.config import get_db

router = APIRouter()

def get_cliente_service(db: AsyncSession = Depends(get_db)) -> ClientService:
    cliente_repo = ClienteRepository(db)
    return ClientService(cliente_repo)

@router.post("/clientes/", response_model=ReadClientSchema)
async def create_client(
    cliente_data: CreateClientSchema,
    cliente_service: ClientService = Depends(get_cliente_service)
):
    try:
        return await cliente_service.create_client(cliente_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/clientes/{cliente_id}", response_model=ReadClientSchema)
async def get_client_by_id(
    cliente_id: int,
    cliente_service: ClientService = Depends(get_cliente_service)
):
    try:
        return await cliente_service.get_client_by_id(cliente_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/clientes/", response_model=List[ReadClientSchema])
async def get_clients(cliente_service: ClientService = Depends(get_cliente_service)):
    return await cliente_service.get_clients()

@router.put("/clientes/{cliente_id}", response_model=ReadClientSchema)
async def update_client(
    cliente_id: int,
    cliente_data: UpdateClientSchema,
    cliente_service: ClientService = Depends(get_cliente_service)
):
    try:
        return await cliente_service.update_client(cliente_id, cliente_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/clientes/{cliente_id}")
async def delete_client(
    cliente_id: int,
    cliente_service: ClientService = Depends(get_cliente_service)
):
    try:
        await cliente_service.delete_client(cliente_id)
        return {"message": "Cliente eliminado exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
