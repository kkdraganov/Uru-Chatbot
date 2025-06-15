from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime

class ConversationBase(BaseModel):
    """Base conversation schema."""
    title: str
    model: str


class ConversationCreate(ConversationBase):
    """Conversation creation schema."""
    pass


class ConversationUpdate(BaseModel):
    """Conversation update schema."""
    title: Optional[str] = None
    model: Optional[str] = None
    token_count: Optional[int] = None


class ConversationInDBBase(ConversationBase):
    """Base schema for Conversation in DB."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    token_count: int
    
    model_config = ConfigDict(from_attributes=True)


class Conversation(ConversationInDBBase):
    """Conversation schema for API responses."""
    pass
