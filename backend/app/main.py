from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

from app.api.router import api_router
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# DEBUG: Log FastAPI app initialization (main.py:app_creation)
logger.info(f"[MAIN] FastAPI app created: {settings.PROJECT_NAME}")
logger.info(f"[MAIN] OpenAPI URL: {settings.API_V1_STR}/openapi.json")

# Set up CORS
cors_origins = settings.CORS_ORIGINS
# DEBUG: Log CORS configuration (main.py:cors_setup)
logger.info(f"[MAIN] Setting up CORS with origins: {cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root endpoint
@app.get("/")
async def root():
    return JSONResponse(
        content={
            "message": "Welcome to Uru ChatGPT Interface API",
            "docs_url": "/docs",
            "health_check": "/health"
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return JSONResponse(
        content={
            "status": "healthy",
            "version": "1.0.0"
        }
    )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
