from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate, ConversationUpdate

class ConversationRepository:
    """Repository for conversation operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, data: ConversationCreate, user_id: int) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(
            title=data.title,
            user_id=user_id,
            model=data.model
        )
        self.session.add(conversation)
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation
    
    async def get_by_id(self, conversation_id: int, user_id: int) -> Optional[Conversation]:
        """Get conversation by ID for a specific user."""
        query = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
        result = await self.session.execute(query)
        return result.scalars().first()
    
    async def get_all_by_user(self, user_id: int) -> List[Conversation]:
        """Get all conversations for a user."""
        query = select(Conversation).where(
            Conversation.user_id == user_id
        ).order_by(Conversation.updated_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def update(
        self, 
        conversation_id: int, 
        user_id: int, 
        data: ConversationUpdate
    ) -> Optional[Conversation]:
        """Update conversation metadata."""
        conversation = await self.get_by_id(conversation_id, user_id)
        if not conversation:
            return None
        
        for key, value in data.dict(exclude_unset=True).items():
            setattr(conversation, key, value)
        
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation
    
    async def delete(self, conversation_id: int, user_id: int) -> bool:
        """Delete a conversation."""
        conversation = await self.get_by_id(conversation_id, user_id)
        if not conversation:
            return False
        
        await self.session.delete(conversation)
        await self.session.commit()
        return True
