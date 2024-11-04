from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.schemas.vehicle.vehicle_schema import vehicleCreate, vehicleRead, vehicleUpdate
from app.application.services.vehicle.vehicle_service import vehicleService
from app.infrastructure.repositories.vehicle_repository import vehicleRepository
from app.infrastructure.db.orm.config import get_db

router = APIRouter()

def get_vehicle_service(db: AsyncSession = Depends(get_db)) -> vehicleService:
    vehicle_repo = vehicleRepository(db)
    return vehicleService(vehicle_repo)

@router.post("/vehicles", response_model=vehicleRead)
async def create_vehicle(
    vehicle_data: vehicleCreate,
    vehicle_service: vehicleService = Depends(get_vehicle_service)
):
    try:
        return await vehicle_service.create_Vehicle(vehicle_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/vehicles/", response_model=List[vehicleRead])
async def list_Vehicle(vehicle_service: vehicleService = Depends(get_vehicle_service)):
    return await vehicle_service.list_Vehicle()

@router.get("/vehicles/{model_id}", response_model=vehicleRead)
async def search_Vehicle(
    model_id: int,
    vehicle_service: vehicleService = Depends(get_vehicle_service)
):
    try:
        return await vehicle_service.search_Vehicle(model_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/vehicles/{colourId}", response_model=vehicleRead)
async def search_Vehicle_Colour(
    colourId: int,
    vehicle_service: vehicleService = Depends(get_vehicle_service)
):
    try:
        return await vehicle_service.search_Vehicle_Colour(colourId)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.put("/vehicles/{patent}", response_model=vehicleRead)
async def update_vehicle(
    patent: str,
    vehicle_Data: vehicleUpdate,
    vehicle_Service: vehicleService = Depends(get_vehicle_service)
):
    try:
        return await vehicle_Service.update_Vehicle(patent, vehicle_Data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.delete("/vehicles/{patent}")
async def delete_vehicle(
    vehicle_id: int,
    vehicle_service: vehicleService = Depends(get_vehicle_service)
):
    try:
        await vehicle_service.delete_vehicle(vehicle_id)
        return {"message": "Vehiculo eliminado correctamente"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))