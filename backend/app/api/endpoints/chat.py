import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import json

from app.db.base import get_db
from app.db.repositories.conversation import ConversationRepository
from app.models.user import User
from app.api.dependencies import get_current_active_user
from app.schemas.chat import ChatRequest, ChatResponse, ValidateKeyRequest, ValidateKeyResponse
from app.adapters.factory import AdapterFactory
from app.streaming.sse import SSEResponse

router = APIRouter()

@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a message to the chat."""
    try:
        # Convert conversation ID to int
        conversation_id = int(request.conversationId)
        
        # Get conversation
        conversation_repo = ConversationRepository(db)
        conversation = await conversation_repo.get_by_id(conversation_id, current_user.id)
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Store the message in the session for streaming
        # In a real implementation, you might use Redis or another session store
        request_id = str(uuid.uuid4())
        
        # Return success response
        return {
            "message": "Message received, check stream for response",
            "conversationId": request.conversationId
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid conversation ID"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )

@router.get("/stream")
async def stream_response(
    conversationId: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Stream response from AI model."""
    try:
        # Convert conversation ID to int
        conversation_id = int(conversationId)
        
        # Get conversation
        conversation_repo = ConversationRepository(db)
        conversation = await conversation_repo.get_by_id(conversation_id, current_user.id)
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # In a real implementation, you would retrieve the message from the session store
        # and use it to generate a response from the AI model
        
        # For this implementation, we'll create a mock stream
        async def mock_stream():
            # Simulate streaming response
            for i in range(10):
                yield f"This is part {i+1} of the streaming response. "
                await asyncio.sleep(0.5)
        
        # Create SSE response
        sse_response = SSEResponse(mock_stream())
        
        # Return streaming response
        return StreamingResponse(
            sse_response(request),
            media_type="text/event-stream"
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid conversation ID"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error streaming response: {str(e)}"
        )

@router.post("/validate-key", response_model=ValidateKeyResponse)
async def validate_api_key(
    request: ValidateKeyRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Validate OpenAI API key."""
    try:
        # Get OpenAI adapter
        adapter = AdapterFactory.get_adapter("openai")
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI adapter not found"
            )
        
        # Validate API key
        is_valid = await adapter.validate_api_key(request.apiKey)
        
        # Return validation result
        if is_valid:
            return {
                "valid": True,
                "models": adapter.get_available_models()
            }
        else:
            return {
                "valid": False
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating API key: {str(e)}"
        )
