from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.api.endpoints import auth, conversations, chat

api_router = APIRouter()

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return JSONResponse(
        content={
            "status": "healthy",
            "version": "1.0.0"
        }
    )

# Include routers for different endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
