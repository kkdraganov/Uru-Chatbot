from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from dotenv import load_dotenv
import json
import logging

# Load environment variables from .env file if it exists
load_dotenv()

# Configure logging for environment variable debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """Application settings."""

    # API settings (constants)
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Uru Chatbot"

    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "development_secret_key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Instance name for domain configuration
    INSTANCE: str = os.getenv("INSTANCE", "dev")

    def __init__(self):
        super().__init__()
        # DEBUG: Log environment variables when settings are initialized (config.py:__init__)
        logger.info(f"[CONFIG] SECRET_KEY loaded: {'***REDACTED***' if self.SECRET_KEY != 'development_secret_key' else 'development_secret_key'}")
        logger.info(f"[CONFIG] INSTANCE loaded: {self.INSTANCE}")
        logger.info(f"[CONFIG] Production mode: {self.is_production}")
        logger.info(f"[CONFIG] DATABASE_URL: {self.DATABASE_URL}")
        logger.info(f"[CONFIG] CORS_ORIGINS: {self.CORS_ORIGINS}")

    # Auto-detect environment based on INSTANCE or explicit setting
    @property
    def is_production(self) -> bool:
        """Determine if running in production based on INSTANCE or explicit env var."""
        environment = os.getenv("ENVIRONMENT")
        is_prod = environment == "production" or self.INSTANCE != "dev"
        # DEBUG: Log production detection logic (config.py:is_production)
        logger.info(f"[CONFIG] ENVIRONMENT: {environment}, INSTANCE: {self.INSTANCE}, is_production: {is_prod}")
        return is_prod

    # CORS settings - Auto-configured based on environment
    @property
    def CORS_ORIGINS(self) -> List[str]:
        # Allow manual override from environment
        cors_env = os.getenv("CORS_ORIGINS")
        # DEBUG: Log raw CORS environment variable (config.py:CORS_ORIGINS)
        logger.info(f"[CONFIG] Raw CORS_ORIGINS env var: '{cors_env}'")
        logger.info(f"[CONFIG] INSTANCE: '{self.INSTANCE}', is_production: {self.is_production}")

        if cors_env and cors_env.strip():  # Check for non-empty string
            try:
                parsed_cors = json.loads(cors_env)
                # DEBUG: Log CORS origins from environment (config.py:CORS_ORIGINS)
                logger.info(f"[CONFIG] CORS_ORIGINS from env (parsed JSON): {parsed_cors}")
                return parsed_cors
            except json.JSONDecodeError as e:
                # DEBUG: Log CORS origins from environment (config.py:CORS_ORIGINS)
                logger.warning(f"[CONFIG] Failed to parse CORS_ORIGINS as JSON: {e}")
                logger.info(f"[CONFIG] CORS_ORIGINS from env (single string): {cors_env}")
                return [cors_env]

        # Auto-configure based on environment when no env var or empty
        if self.is_production:
            auto_cors = [
                f"https://{self.INSTANCE}.uruenterprises.com",
                f"https://api.{self.INSTANCE}.uruenterprises.com"
            ]
            # DEBUG: Log auto-configured CORS origins (config.py:CORS_ORIGINS)
            logger.info(f"[CONFIG] CORS_ORIGINS auto-configured for production: {auto_cors}")
            return auto_cors
        else:
            # More comprehensive development CORS origins
            dev_cors = [
                "http://localhost:3000",
                "http://localhost:8000",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:8000"
            ]
            # DEBUG: Log auto-configured CORS origins (config.py:CORS_ORIGINS)
            logger.info(f"[CONFIG] CORS_ORIGINS auto-configured for development: {dev_cors}")
            return dev_cors

    # Database settings
    @property
    def DATABASE_URL(self) -> str:
        """Get async database URL from environment."""
        env_url = os.getenv("DATABASE_URL")
        if env_url and env_url.strip():  # Check for non-empty string
            # DEBUG: Log database URL from environment (config.py:DATABASE_URL)
            logger.info(f"[CONFIG] DATABASE_URL from environment: {env_url}")
            return env_url

        # Fallback for development
        fallback_url = "postgresql+asyncpg://postgres:postgres@db:5432/uru_chatbot"
        # DEBUG: Log fallback database URL (config.py:DATABASE_URL)
        logger.info(f"[CONFIG] DATABASE_URL using fallback: {fallback_url}")
        return fallback_url

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Get sync database URL for Alembic by converting async URL."""
        async_url = self.DATABASE_URL
        # Convert async URL to sync URL for Alembic
        sync_url = async_url.replace("postgresql+asyncpg://", "postgresql://")
        return sync_url

    # OpenAI settings (constants - users provide their own keys)
    OPENAI_MODELS: List[str] = [
        "gpt-4o",
        "gpt-4o-mini",
        "o1",
        "o1-mini",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo"
    ]

    # Azure Entra configuration
    AZURE_CLIENT_ID: str = os.getenv("AZURE_CLIENT_ID", "")
    AZURE_TENANT_ID: str = os.getenv("AZURE_TENANT_ID", "")
    AZURE_CLIENT_SECRET: str = os.getenv("AZURE_CLIENT_SECRET", "")
    AZURE_REDIRECT_URI: str = os.getenv("AZURE_REDIRECT_URI", "http://localhost:3000/authorize")

    # Rate limiting settings
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    # Security settings
    MAX_MESSAGE_LENGTH: int = 10000
    MAX_CONVERSATION_HISTORY: int = 100
    
    class Config:
        case_sensitive = True


settings = Settings()
