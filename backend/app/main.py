from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

from app.api.router import api_router
from app.core.config import settings

# Import models to ensure they are registered
from app.models import User, Conversation, Message

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

# Add request logging middleware for debugging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests for debugging."""
    origin = request.headers.get("origin", "no-origin")
    method = request.method
    url = str(request.url)

    # DEBUG: Log all requests (main.py:request_logging)
    logger.info(f"[REQUEST] {method} {url} from origin: {origin}")

    # Log specific headers for CORS debugging
    if method == "OPTIONS":
        access_control_request_method = request.headers.get("access-control-request-method")
        access_control_request_headers = request.headers.get("access-control-request-headers")
        logger.info(f"[PREFLIGHT] Method: {access_control_request_method}, Headers: {access_control_request_headers}")

    response = await call_next(request)

    # DEBUG: Log response status (main.py:response_logging)
    logger.info(f"[RESPONSE] {method} {url} -> {response.status_code}")

    return response

# Set up CORS
cors_origins = settings.CORS_ORIGINS
# DEBUG: Log CORS configuration (main.py:cors_setup)
logger.info(f"[MAIN] Setting up CORS with origins: {cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root endpoint
@app.get("/")
async def root():
    return JSONResponse(
        content={
            "message": "Welcome to the Uru Chatbot API",
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
