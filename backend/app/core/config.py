from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from dotenv import load_dotenv
import json

# Load environment variables from .env file if it exists
load_dotenv()

class Settings(BaseSettings):
    """Application settings."""

    # API settings (constants)
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Uru ChatGPT Interface"

    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "development_secret_key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Instance name for domain configuration
    INSTANCE: str = os.getenv("INSTANCE", "dev")

    # Auto-detect environment based on INSTANCE or explicit setting
    @property
    def is_production(self) -> bool:
        """Determine if running in production based on INSTANCE or explicit env var."""
        return os.getenv("NODE_ENV") == "production" or self.INSTANCE != "dev"

    # CORS settings - Auto-configured based on environment
    @property
    def CORS_ORIGINS(self) -> List[str]:
        # Allow manual override
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env:
            try:
                return json.loads(cors_env)
            except json.JSONDecodeError:
                return [cors_env]

        # Auto-configure based on environment
        if self.is_production:
            return [
                f"https://{self.INSTANCE}.uruenterprises.com",
                f"https://api.{self.INSTANCE}.uruenterprises.com"
            ]
        else:
            return ["http://localhost:3000"]

    # Database settings
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = "uru_chatbot"
    POSTGRES_SERVER: str = "db"
    POSTGRES_PORT: int = 5432
    
    @property
    def DATABASE_URL(self) -> str:
        """Get async database URL."""
        # Use environment variable if provided, otherwise construct from components
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            return env_url
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Get sync database URL for Alembic."""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # OpenAI settings (constants - users provide their own keys)
    OPENAI_MODELS: List[str] = [
        "gpt-4o",
        "gpt-4o-mini",
        "o1-preview",
        "o1-mini"
    ]
    
    class Config:
        case_sensitive = True


settings = Settings()
