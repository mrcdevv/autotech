from pydantic import BaseModel, EmailStr
from typing import Optional

class CreateClientSchema(BaseModel):
    document: int
    name: str
    surname: str
    address: str
    email: EmailStr
    phone: str
    type_id: int

    class Config:
        from_attributes = True

class UpdateClientSchema(BaseModel):
    nombre: Optional[str] = None
    surname: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    id_tipo: Optional[int] = None

    class Config:
        from_attributes = True

class ReadClientSchema(BaseModel):
    document: int
    name: str
    surname: str
    address: str
    email: EmailStr
    phone: str
    type_id: int

    class Config:
        from_attributes = True
