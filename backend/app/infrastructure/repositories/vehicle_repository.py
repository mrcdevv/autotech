from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.infrastructure.db.orm.tables import Vehicle
from app.api.schemas.vehicle.vehicle_schema import vehicleCreate, vehicleRead, vehicleUpdate
from app.domain.interfaces.vehicle.repository import vehicleRepoInterface
from typing import List, Optional

class vehicleRepository(vehicleRepoInterface):
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def create_Vehicle(self, vehicle: vehicleCreate) -> vehicleRead:
        newVehicle = Vehicle(
            veh_id = vehicle.IdVehicle,
            vehcli_id = vehicle.OwnerDocument,
            veh_modelo_id = vehicle.ModelId,
            veh_patente = vehicle.Patent,
            veh_anio= vehicle.Year,
            veh_color_id = vehicle.ColourId
    )
        self.db_session.add(newVehicle)
        try:
            await self.db_session.commit()
            await self.db_session.refresh(newVehicle)
            return vehicleRead.model_validate({
                "IdVehicle": vehicle.IdVehicle,
                "OwnerDocument": vehicle.OwnerDocument,
                "ModelId": vehicle.ModelId,
                "Patent": vehicle.Patent,
                "Year": vehicle.Year,
                "ColourId": vehicle.ColourId
            })
        except IntegrityError:
            await self.db_session.rollback()
        raise ValueError("El id ya se encuentra registrado en la base de datos")
    
    async def update_Vehicle(self, patent: int, vehicle_data: vehicleUpdate) -> Optional[vehicleRead]:
       
        query = select(Vehicle).where(Vehicle.patent == patent)
        result = await self.db_session.execute(query)
        vehicle = result.scalars().first()
        
        
        if vehicle:
            
            for key, value in vehicle_data.dict(exclude_unset=True).items():
                setattr(vehicle, key, value)
            
            try:
                await self.db_session.commit()
                await self.db_session.refresh(vehicle)
                
                
                return vehicleRead.model_validate({
                    "IdVehicle": vehicle.IdVehicle,
                    "OwnerDocument": vehicle.OwnerDocument,
                    "ModelId": vehicle.ModelId,
                    "Patent": vehicle.Patent,
                    "Year": vehicle.Year,
                    "ColourId": vehicle.ColourId
                })
            except IntegrityError:
                await self.db_session.rollback()
                raise ValueError("Error al actualizar el vehículo.")
        
        
        return None
    
    async def remove_Vehicle(self, patent: int) -> bool:
        # Buscar el vehículo por su IdVehicle
        query = select(Vehicle).where(Vehicle.Patent == patent)
        result = await self.db_session.execute(query)
        vehicle = result.scalars().first()
        
        if vehicle:
            await self.db_session.delete(vehicle)  
            await self.db_session.commit()          
            return True                             
        
        return False 

    async def list_Vehicle(self) -> List[vehicleRead]:
        query = select(Vehicle)
        result = await self.db_session.execute(query)
        vehicles = result.scalars().all()

        return[vehicleRead.model_validate({
            "IdVehicle": vehicle.IdVehicle,
            "OwnerDocument": vehicle.OwnerDocument,
            "ModelId": vehicle.ModelId,
            "Patent": vehicle.Patent,
            "Year": vehicle.Year,
            "ColourId": vehicle.ColourId
        }) for vehicle in vehicles]
    
    async def search_Vehicle(self, model_id: int) -> Optional[vehicleRead]:
        query = select(Vehicle).where(Vehicle.ModelId == model_id)
        result = await self.db_session.execute(query)
        vehicle = result.scalars().first()
        
        if vehicle:
            return vehicleRead.model_validate({
                "IdVehicle": vehicle.IdVehicle,
                "OwnerDocument": vehicle.OwnerDocument,
                "ModelId": vehicle.ModelId,
                "Patent": vehicle.Patent,
                "Year": vehicle.Year,
                "ColourId": vehicle.ColourId,
            })
        
        return None
    
    async def search_Vehicle_Colour(self, colour_id: int) -> Optional[vehicleRead]:
        query = select(Vehicle).where(Vehicle.ColourId == colour_id)  # Filtra por el ColourId
        result = await self.db_session.execute(query)
        vehicle = result.scalars().first()  # Obtiene el primer vehículo que coincide

        if vehicle:
            return vehicleRead.model_validate({
                "IdVehicle": vehicle.IdVehicle,
                "OwnerDocument": vehicle.OwnerDocument,
                "ModelId": vehicle.ModelId,
                "Patent": vehicle.Patent,
                "Year": vehicle.Year,
                "ColourId": vehicle.ColourId,
            })

        return None