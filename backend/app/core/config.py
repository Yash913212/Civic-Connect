import secrets
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicConnect"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/civic"
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OPENROUTER_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    MAX_UPLOAD_SIZE_MB: int = 10

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

if not settings.SECRET_KEY:
    raise ValueError(
        "SECRET_KEY is not set! "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\" "
        "and add it to your .env file."
    )
