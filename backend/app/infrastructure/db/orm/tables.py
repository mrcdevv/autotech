from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Client(Base):
    __tablename__ = 'clientes'

    cli_id = Column(Integer, primary_key=True, index=True)
    cli_dni = Column(Integer, unique=True, index=True, nullable=False)
    cli_nombre = Column(String, nullable=False)
    cli_apellido = Column(String, nullable=False)
    cli_direccion = Column(String, nullable=False)
    cli_correo = Column(String, nullable=False)
    cli_celular = Column(String, nullable=False)
    cli_id_tipo = Column(Integer, nullable=False)
