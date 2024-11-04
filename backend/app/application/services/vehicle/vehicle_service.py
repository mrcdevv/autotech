from app.domain.interfaces.vehicle.repository import vehicleRepoInterface
from app.api.schemas.vehicle.vehicle_schema import vehicleCreate, vehicleRead, vehicleUpdate
from typing import List, Optional

class vehicleService:
    def __init__(self, Vehicle_Repo: vehicleRepoInterface):
        self.Vehicle_Repo = Vehicle_Repo
        
    async def create_Vehicle(self, vehicleDate: vehicleCreate) -> vehicleRead:
        try:
            return await self.Vehicle_Repo.create_Vehicle(vehicleDate)
        except ValueError as e:
            raise ValueError(f"Error al crear el cliente: {e}")
        
    async def list_Vehicle(self) ->list[vehicleRead]:
        return await self.Vehicle_Repo.list_Vehicle()
    
    async def update_Vehicle(self, patent: int, vehicle_data: vehicleUpdate) -> Optional[vehicleRead]:
        try:
            updateVehicle = await self.Vehicle_Repo.Update_Vehicle(patent, vehicle_data)
            if updateVehicle is None:
                raise ValueError(f"Vehiculo con patente {patent} no encontrado en la base de datos")
            return updateVehicle
        except ValueError as e:
            raise ValueError(f"Error al actualizar vehiculo: {e}")
        
    async def remove_Vehicle(self, patent: int) -> bool:
        delete = await self.Vehicle_Repo.remove_Vehicle(patent)
        if not delete:
            raise ValueError(f"Vehiculo con patente {patent} no encontrado en la base de datos")
        return delete 
    
    async def search_Vehicle(self, ModelId: int) -> List[vehicleRead]:
        vehicle = await self.Vehicle_Repo.search_Vehicle(ModelId)
        if vehicle is None:
            raise ValueError(f"Vehiculo modelo {ModelId} no encontrado")
        return vehicle
    
    async def search_Vehicle_Colour(self, ColourId: int) -> List[vehicleRead]:
        vehicle = await self.Vehicle_Repo.search_Vehicle_Colour(ColourId)
        if vehicle is None:
            raise ValueError(f"Vehiculos de color {ColourId} no encontrados")
        return vehicle