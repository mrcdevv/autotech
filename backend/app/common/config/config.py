from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

env_path = Path(__file__).resolve().parent.parent.parent / '.env'

class Settings(BaseSettings):
    DATABASE_DIALECT : str
    DATABASE_USER : str
    DATABASE_PASSWORD : str
    DATABASE_HOST : str
    DATABASE_PORT : int
    DATABASE_NAME : str

    model_config = SettingsConfigDict( env_file=env_path, extra="ignore")

Config = Settings()