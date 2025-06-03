from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.base import get_db
from app.db.repositories.conversation import ConversationRepository
from app.models.user import User
from app.api.dependencies import get_current_active_user
from app.schemas.conversation import Conversation, ConversationCreate, ConversationUpdate

router = APIRouter()

@router.get("/", response_model=List[Conversation])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all conversations for current user."""
    conversation_repo = ConversationRepository(db)
    conversations = await conversation_repo.get_all_by_user(current_user.id)
    return conversations

@router.post("/", response_model=Conversation, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new conversation."""
    conversation_repo = ConversationRepository(db)
    conversation = await conversation_repo.create(data, current_user.id)
    return conversation

@router.get("/{conversation_id}", response_model=Conversation)
async def get_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific conversation."""
    conversation_repo = ConversationRepository(db)
    conversation = await conversation_repo.get_by_id(conversation_id, current_user.id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation

@router.patch("/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: int,
    data: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update conversation metadata."""
    conversation_repo = ConversationRepository(db)
    conversation = await conversation_repo.update(conversation_id, current_user.id, data)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a conversation."""
    conversation_repo = ConversationRepository(db)
    success = await conversation_repo.delete(conversation_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return None
