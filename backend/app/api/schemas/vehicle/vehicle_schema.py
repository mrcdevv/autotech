from pydantic import BaseModel
from typing import Optional


class vehicleCreate(BaseModel):
    IdVehicle: int
    OwnerDocument: int
    ModelId: int
    Patent: str
    Year: int
    ColourId: int
    
    class Config:
        from_attributes = True


class vehicleRead(BaseModel):
    IdVehicle: int
    OwnerDocument: int
    ModelId: int
    Patent: str
    Year: int
    ColourId: int

    class Config:
        from_attributes = True


class vehicleUpdate(BaseModel):
    ModelId: Optional[int] = None
    Patent: Optional[int] = None
    Year: Optional[int] = None
    ColourId: Optional[int]  = None
    