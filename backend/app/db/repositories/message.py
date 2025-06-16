from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from typing import List, Optional
import hashlib

from app.models.message import Message
from app.schemas.chat import MessageCreate, MessageResponse

class MessageRepository:
    """Repository for message operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(
        self, 
        conversation_id: int, 
        role: str, 
        content: str,
        token_count: int = 0,
        ai_model: Optional[str] = None,
        cost_estimate: float = 0.0,
        processing_time: Optional[float] = None,
        is_error: bool = False,
        error_type: Optional[str] = None,
        message_metadata: Optional[str] = None
    ) -> Message:
        """Create a new message."""
        # Create content hash for deduplication
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content_hash=content_hash,
            token_count=token_count,
            ai_model=ai_model,
            cost_estimate=cost_estimate,
            processing_time=processing_time,
            is_error=is_error,
            error_type=error_type,
            message_metadata=message_metadata
        )
        
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message
    
    async def get_by_id(self, message_id: int) -> Optional[Message]:
        """Get message by ID."""
        result = await self.db.execute(
            select(Message).where(Message.id == message_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_conversation(
        self, 
        conversation_id: int, 
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Message]:
        """Get messages for a conversation."""
        query = select(Message).where(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at)
        
        if limit:
            query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_conversation_stats(self, conversation_id: int) -> dict:
        """Get statistics for a conversation."""
        result = await self.db.execute(
            select(
                func.count(Message.id).label('message_count'),
                func.sum(Message.token_count).label('total_tokens'),
                func.sum(Message.cost_estimate).label('total_cost'),
                func.max(Message.created_at).label('last_message_at')
            ).where(Message.conversation_id == conversation_id)
        )
        
        stats = result.first()
        return {
            'message_count': stats.message_count or 0,
            'total_tokens': stats.total_tokens or 0,
            'total_cost': float(stats.total_cost or 0.0),
            'last_message_at': stats.last_message_at
        }
    
    async def delete_by_conversation(self, conversation_id: int) -> int:
        """Delete all messages for a conversation."""
        result = await self.db.execute(
            select(Message).where(Message.conversation_id == conversation_id)
        )
        messages = result.scalars().all()
        
        for message in messages:
            await self.db.delete(message)
        
        await self.db.commit()
        return len(messages)
    
    async def get_recent_messages(
        self, 
        conversation_id: int, 
        limit: int = 10
    ) -> List[Message]:
        """Get recent messages for context."""
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(desc(Message.created_at))
            .limit(limit)
        )
        
        messages = result.scalars().all()
        return list(reversed(messages))  # Return in chronological order
    
    async def update_stats(
        self, 
        message_id: int, 
        token_count: int, 
        cost_estimate: float,
        processing_time: float
    ) -> Optional[Message]:
        """Update message statistics."""
        message = await self.get_by_id(message_id)
        if message:
            message.token_count = token_count
            message.cost_estimate = cost_estimate
            message.processing_time = processing_time
            await self.db.commit()
            await self.db.refresh(message)
        return message
