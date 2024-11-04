from abc import ABC, abstractmethod
from typing import List, Optional
from app.api.schemas.vehicle.vehicle_schema import vehicleCreate, vehicleUpdate, vehicleRead

class vehicleRepoInterface(ABC):

    #Crear Vehiculo
    @abstractmethod
    async def create_Vehicle(self, Vehicle: vehicleCreate) -> vehicleRead:

        pass
    
    #Eliminar vehiculo por idVehiculo
    @abstractmethod
    async def remove_Vehicle(self,IdVehicle: int ) -> bool:

        pass

    #Actualizar Vehiculo
    @abstractmethod
    async def update_Vehicle(self, Patente: int, Vehicle: vehicleUpdate) -> Optional[vehicleRead]:

        pass
    
    #Listar todos los vehiculos
    async def list_Vehicle(self) -> List[vehicleRead]:
        pass
   
    #Listar por modelo
    @abstractmethod
    async def search_Vehicle(self, ModelId: int) -> List[vehicleRead]:
        pass
    
    #Listar por Color
    @abstractmethod
    async def search_Vehicle_Colour(self, ColourId: int) -> List[vehicleRead]:
        pass