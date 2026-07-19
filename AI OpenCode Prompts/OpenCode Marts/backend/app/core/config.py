from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Marts AI Platform"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "marts"
    db_password: str = "marts_secret"
    db_name: str = "marts_db"
    db_echo: bool = False

    jwt_secret_key: str = "change-me-in-production-use-a-real-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_expire_minutes: int = 15
    jwt_refresh_expire_days: int = 7

    openai_api_key: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_number: str = ""

    log_level: str = "INFO"
    log_json: bool = True

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": False}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
