from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, asc, func
from typing import List, Optional, Tuple
from datetime import datetime
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate, ConversationUpdate, ConversationSearch

class ConversationRepository:
    """Enhanced repository for conversation operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: ConversationCreate, user_id: int) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(
            title=data.title,
            user_id=user_id,
            model=data.model,
            system_prompt=data.system_prompt
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
        
        for key, value in data.model_dump(exclude_unset=True).items():
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

    async def update_stats(
        self,
        conversation_id: int,
        message_count: int,
        total_tokens: int,
        estimated_cost: float,
        last_message_at: datetime
    ) -> Optional[Conversation]:
        """Update conversation statistics."""
        conversation = await self.get_by_id_admin(conversation_id)
        if not conversation:
            return None

        conversation.message_count = message_count
        conversation.total_tokens = total_tokens
        conversation.estimated_cost = estimated_cost
        conversation.last_message_at = last_message_at
        conversation.updated_at = func.now()

        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation

    async def get_by_id_admin(self, conversation_id: int) -> Optional[Conversation]:
        """Get conversation by ID (admin access, no user restriction)."""
        result = await self.session.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def search(self, search_params: ConversationSearch, user_id: int) -> Tuple[List[Conversation], int]:
        """Search conversations with filters and pagination."""
        query = select(Conversation).where(Conversation.user_id == user_id)

        # Apply filters
        if search_params.query:
            query = query.where(Conversation.title.ilike(f"%{search_params.query}%"))

        if search_params.model:
            query = query.where(Conversation.model == search_params.model)

        if search_params.is_archived is not None:
            query = query.where(Conversation.is_archived == search_params.is_archived)

        if search_params.is_pinned is not None:
            query = query.where(Conversation.is_pinned == search_params.is_pinned)

        if search_params.date_from:
            query = query.where(Conversation.created_at >= search_params.date_from)

        if search_params.date_to:
            query = query.where(Conversation.created_at <= search_params.date_to)

        if search_params.min_messages:
            query = query.where(Conversation.message_count >= search_params.min_messages)

        if search_params.max_messages:
            query = query.where(Conversation.message_count <= search_params.max_messages)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()

        # Apply sorting
        sort_column = getattr(Conversation, search_params.sort_by)
        if search_params.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Apply pagination
        offset = (search_params.page - 1) * search_params.per_page
        query = query.offset(offset).limit(search_params.per_page)

        result = await self.session.execute(query)
        conversations = result.scalars().all()

        return conversations, total

    async def bulk_action(self, conversation_ids: List[int], user_id: int, action: str) -> int:
        """Perform bulk action on conversations."""
        query = select(Conversation).where(
            and_(
                Conversation.id.in_(conversation_ids),
                Conversation.user_id == user_id
            )
        )
        result = await self.session.execute(query)
        conversations = result.scalars().all()

        updated_count = 0
        for conversation in conversations:
            if action == "archive":
                conversation.is_archived = True
            elif action == "unarchive":
                conversation.is_archived = False
            elif action == "pin":
                conversation.is_pinned = True
            elif action == "unpin":
                conversation.is_pinned = False
            elif action == "delete":
                await self.session.delete(conversation)

            updated_count += 1

        await self.session.commit()
        return updated_count
