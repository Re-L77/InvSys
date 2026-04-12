from functools import lru_cache
from typing import Any

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "InvSys API"
    app_env: str = "development"
    debug: bool = False
    database_url: str = "mysql+pymysql://root:password@localhost:3306/invsys"
    cors_origins: list[str] = ["http://localhost:5173"]
    cors_allow_credentials: bool = True
    trusted_hosts: list[str] = ["localhost", "127.0.0.1"]
    force_https_redirect: bool = False
    expose_docs: bool = True
    auth_secret_key: str = "dev-secret-change-me"
    auth_access_token_minutes: int = 60
    auth_refresh_token_days: int = 7

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("cors_origins", "trusted_hosts", mode="before")
    @classmethod
    def _parse_list(cls, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str):
            raw = value.strip()
            if raw.startswith("[") and raw.endswith("]"):
                import json

                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            return [item.strip() for item in raw.split(",") if item.strip()]
        return []

    @model_validator(mode="after")
    def _validate_security(self) -> "Settings":
        env = self.app_env.lower()
        if env in {"production", "prod"}:
            if self.auth_secret_key == "dev-secret-change-me" or len(self.auth_secret_key) < 32:
                raise ValueError("AUTH_SECRET_KEY must be set to a strong value (>=32 chars) in production")
            if not self.trusted_hosts:
                raise ValueError("TRUSTED_HOSTS must not be empty in production")
            if not self.cors_origins:
                raise ValueError("CORS_ORIGINS must be explicitly configured in production")
            if any(origin == "*" for origin in self.cors_origins):
                raise ValueError("CORS_ORIGINS cannot include '*' in production")
            if self.debug:
                raise ValueError("DEBUG must be false in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
