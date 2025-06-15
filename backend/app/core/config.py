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
    PROJECT_NAME: str = "Uru ChatGPT Interface"

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
        logger.info(f"[CONFIG] POSTGRES_USER: {self.POSTGRES_USER}")
        logger.info(f"[CONFIG] POSTGRES_DB: {self.POSTGRES_DB}")
        logger.info(f"[CONFIG] DATABASE_URL: {self.DATABASE_URL}")
        logger.info(f"[CONFIG] CORS_ORIGINS: {self.CORS_ORIGINS}")

    # Auto-detect environment based on INSTANCE or explicit setting
    @property
    def is_production(self) -> bool:
        """Determine if running in production based on INSTANCE or explicit env var."""
        node_env = os.getenv("NODE_ENV")
        is_prod = node_env == "production" or self.INSTANCE != "dev"
        # DEBUG: Log production detection logic (config.py:is_production)
        logger.info(f"[CONFIG] NODE_ENV: {node_env}, INSTANCE: {self.INSTANCE}, is_production: {is_prod}")
        return is_prod

    # CORS settings - Auto-configured based on environment
    @property
    def CORS_ORIGINS(self) -> List[str]:
        # Allow manual override from environment
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env and cors_env.strip():  # Check for non-empty string
            try:
                parsed_cors = json.loads(cors_env)
                # DEBUG: Log CORS origins from environment (config.py:CORS_ORIGINS)
                logger.info(f"[CONFIG] CORS_ORIGINS from env (parsed JSON): {parsed_cors}")
                return parsed_cors
            except json.JSONDecodeError:
                # DEBUG: Log CORS origins from environment (config.py:CORS_ORIGINS)
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
            dev_cors = ["http://localhost:3000"]
            # DEBUG: Log auto-configured CORS origins (config.py:CORS_ORIGINS)
            logger.info(f"[CONFIG] CORS_ORIGINS auto-configured for development: {dev_cors}")
            return dev_cors

    # Database settings
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = "uru_chatbot"
    POSTGRES_SERVER: str = "db"
    POSTGRES_PORT: int = 5432
    
    @property
    def DATABASE_URL(self) -> str:
        """Get async database URL."""
        # Use environment variable if provided and not empty, otherwise construct from components
        env_url = os.getenv("DATABASE_URL")
        if env_url and env_url.strip():  # Check for non-empty string
            # DEBUG: Log database URL from environment (config.py:DATABASE_URL)
            logger.info(f"[CONFIG] DATABASE_URL from environment: {env_url}")
            return env_url

        # Construct from individual components when env var is empty or missing
        constructed_url = f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        # DEBUG: Log constructed database URL (config.py:DATABASE_URL)
        logger.info(f"[CONFIG] DATABASE_URL constructed: {constructed_url}")
        return constructed_url

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
