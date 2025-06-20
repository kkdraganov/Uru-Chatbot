from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List, Optional
import hashlib

from app.models.message import Message

class MessageRepository:
    """Repository for message operations."""

    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(
        self,
        conversation_id: int,
        sender: str,
        content: str,
        ai_model: Optional[str] = None,
        is_error: bool = False,
        error_details: Optional[dict] = None
    ) -> Message:
        """Create a new message."""
        # Create content hash for deduplication
        content_hash = hashlib.sha256(content.encode()).hexdigest()

        message = Message(
            conversation_id=conversation_id,
            sender=sender,
            content=content,
            content_hash=content_hash,
            ai_model=ai_model,
            is_error=is_error,
            error_details=error_details
        )

        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)
        return message
    
    async def get_by_id(self, message_id: int) -> Optional[Message]:
        """Get message by ID."""
        result = await self.session.execute(
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

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_conversation_stats(self, conversation_id: int) -> dict:
        """Get statistics for a conversation."""
        result = await self.session.execute(
            select(
                func.count(Message.id).label('message_count'),
                func.max(Message.created_at).label('last_message_at')
            ).where(Message.conversation_id == conversation_id)
        )

        stats = result.first()
        return {
            'message_count': stats.message_count or 0,
            'last_message_at': stats.last_message_at
        }
    
    async def delete_by_conversation(self, conversation_id: int) -> int:
        """Delete all messages for a conversation."""
        result = await self.session.execute(
            select(Message).where(Message.conversation_id == conversation_id)
        )
        messages = result.scalars().all()

        for message in messages:
            await self.session.delete(message)

        await self.session.commit()
        return len(messages)

    async def get_recent_messages(
        self,
        conversation_id: int,
        limit: int = 10
    ) -> List[Message]:
        """Get recent messages for context."""
        result = await self.session.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(desc(Message.created_at))
            .limit(limit)
        )

        messages = result.scalars().all()
        return list(reversed(messages))  # Return in chronological order
    
    # Note: update_stats method removed as token_count, cost_estimate, and processing_time
    # fields don't exist in the database schema. These are API-level metrics, not database fields.
