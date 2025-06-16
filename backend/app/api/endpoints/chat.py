import asyncio
import time
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import json
import logging

from app.db.base import get_db
from app.db.repositories.conversation import ConversationRepository
from app.db.repositories.message import MessageRepository
from app.models.user import User
from app.api.dependencies import get_current_active_user
from app.schemas.chat import (
    ChatRequest, ChatResponse, ValidateKeyRequest, ValidateKeyResponse,
    StreamChunk, ModelInfo, AvailableModelsResponse
)
from app.adapters.factory import AdapterFactory
from app.streaming.sse import SSEResponse
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/message")
async def send_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a message and get streaming response."""
    try:
        # Validate user permissions
        if not current_user.can_create_conversations:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to send messages"
            )

        # Get conversation
        conversation_repo = ConversationRepository(db)
        conversation = await conversation_repo.get_by_id(request.conversation_id, current_user.id)

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        # Validate message length
        if len(request.message) > settings.MAX_MESSAGE_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Message too long. Maximum length is {settings.MAX_MESSAGE_LENGTH} characters"
            )

        # Get adapter
        adapter = AdapterFactory.get_adapter("openai")
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI adapter not available"
            )

        # Validate API key
        key_validation = await adapter.validate_api_key(request.api_key)
        if not key_validation["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid API key: {key_validation.get('error', 'Unknown error')}"
            )

        # Create user message
        message_repo = MessageRepository(db)
        user_message = await message_repo.create(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
            token_count=len(request.message.split()) * 1.3  # Rough token estimate
        )

        # Prepare message history for context
        recent_messages = await message_repo.get_recent_messages(
            conversation.id,
            limit=settings.MAX_CONVERSATION_HISTORY
        )

        # Build messages for API
        messages = []
        if conversation.system_prompt:
            messages.append({"role": "system", "content": conversation.system_prompt})

        # Add conversation history (we don't store content, so this is simplified)
        # In a real implementation, you'd need to handle this differently
        messages.append({"role": "user", "content": request.message})

        # Stream response
        async def generate_response():
            assistant_message = None
            full_content = ""

            try:
                async for content, metadata in adapter.generate_stream(
                    messages=messages,
                    model=request.model or conversation.model,
                    api_key=request.api_key,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens
                ):
                    if metadata["type"] == "content":
                        full_content += content
                        yield f"data: {json.dumps({'content': content, 'type': 'chunk'})}\n\n"

                    elif metadata["type"] == "complete":
                        # Create assistant message
                        assistant_message = await message_repo.create(
                            conversation_id=conversation.id,
                            role="assistant",
                            content=metadata["full_content"],
                            token_count=metadata["total_tokens"],
                            ai_model=metadata["model_used"],
                            cost_estimate=metadata["cost_estimate"],
                            processing_time=metadata["processing_time"]
                        )

                        # Update conversation stats
                        stats = await message_repo.get_conversation_stats(conversation.id)
                        await conversation_repo.update_stats(
                            conversation.id,
                            message_count=stats["message_count"],
                            total_tokens=stats["total_tokens"],
                            estimated_cost=stats["total_cost"],
                            last_message_at=stats["last_message_at"]
                        )

                        yield f"data: {json.dumps({'type': 'complete', 'message_id': assistant_message.id, 'cost': metadata['cost_estimate']})}\n\n"

                    elif metadata["type"] == "error":
                        # Create error message
                        await message_repo.create(
                            conversation_id=conversation.id,
                            role="assistant",
                            content=f"Error: {metadata['error']}",
                            is_error=True,
                            error_type="api_error",
                            processing_time=metadata.get("processing_time", 0)
                        )

                        yield f"data: {json.dumps({'type': 'error', 'error': metadata['error']})}\n\n"

            except Exception as e:
                logger.error(f"Error in streaming response: {str(e)}")
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )

@router.post("/validate-key", response_model=ValidateKeyResponse)
async def validate_api_key(
    request: ValidateKeyRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Validate OpenAI API key."""
    try:
        adapter = AdapterFactory.get_adapter("openai")
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI adapter not available"
            )

        validation_result = await adapter.validate_api_key(request.api_key)

        return ValidateKeyResponse(
            valid=validation_result["valid"],
            models=validation_result.get("models"),
            organization=validation_result.get("organization"),
            error=validation_result.get("error")
        )

    except Exception as e:
        logger.error(f"Error validating API key: {str(e)}")
        return ValidateKeyResponse(
            valid=False,
            error=str(e)
        )

@router.get("/models", response_model=AvailableModelsResponse)
async def get_available_models(
    current_user: User = Depends(get_current_active_user)
):
    """Get available AI models with detailed information."""
    try:
        adapter = AdapterFactory.get_adapter("openai")
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI adapter not available"
            )

        models = adapter.get_available_models()
        model_info_list = []

        for model_id in models:
            info = adapter.get_model_info(model_id)
            model_info = ModelInfo(
                id=model_id,
                name=info.get("name", model_id),
                description=info.get("description", ""),
                context_length=info.get("context_length", 4096),
                input_cost_per_token=info.get("input_cost_per_token", 0.0),
                output_cost_per_token=info.get("output_cost_per_token", 0.0),
                supports_streaming=info.get("supports_streaming", True)
            )
            model_info_list.append(model_info)

        return AvailableModelsResponse(
            models=model_info_list,
            default_model="gpt-4o"
        )

    except Exception as e:
        logger.error(f"Error getting available models: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting available models: {str(e)}"
        )

@router.get("/models/{model_id}")
async def get_model_info(
    model_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed information about a specific model."""
    try:
        adapter = AdapterFactory.get_adapter("openai")
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI adapter not available"
            )

        if model_id not in adapter.get_available_models():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model not found"
            )

        info = adapter.get_model_info(model_id)
        return ModelInfo(
            id=model_id,
            name=info.get("name", model_id),
            description=info.get("description", ""),
            context_length=info.get("context_length", 4096),
            input_cost_per_token=info.get("input_cost_per_token", 0.0),
            output_cost_per_token=info.get("output_cost_per_token", 0.0),
            supports_streaming=info.get("supports_streaming", True)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting model info: {str(e)}"
        )


