from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "InvSys API"
    database_url: str = "mysql+pymysql://root:password@localhost:3306/invsys"
    cors_origins: list[str] = ["http://localhost:5173"]
    db_test_admin_url: str | None = None
    db_test_almacen_url: str | None = None
    db_test_super_url: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
