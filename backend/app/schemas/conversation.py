from pydantic import BaseModel, Field, ConfigDict, validator
from typing import Optional, List
from datetime import datetime

class ConversationBase(BaseModel):
    """Base conversation schema matching actual database schema."""
    title: str = Field(..., min_length=1, max_length=255)
    ai_model: str = Field(..., min_length=1, max_length=100)  # Frontend expects ai_model, model provides this via property
    system_prompt: Optional[str] = None

class ConversationCreate(ConversationBase):
    """Conversation creation schema."""
    pass

class ConversationUpdate(BaseModel):
    """Conversation update schema."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    ai_model: Optional[str] = Field(None, min_length=1, max_length=100)  # Frontend expects ai_model, model provides this via property
    system_prompt: Optional[str] = None
    is_archived: Optional[bool] = None
    is_pinned: Optional[bool] = None

class ConversationInDBBase(ConversationBase):
    """Base schema for Conversation in DB."""
    id: int
    user_id: int
    is_archived: bool = False
    is_pinned: bool = False
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Conversation(ConversationInDBBase):
    """Conversation schema for API responses."""
    pass

class ConversationListResponse(BaseModel):
    """Schema for conversation list response."""
    conversations: List[Conversation]
    total: int
    page: int
    per_page: int
    total_pages: int

class ConversationSearch(BaseModel):
    """Schema for conversation search."""
    query: Optional[str] = None
    ai_model: Optional[str] = None  # Frontend expects ai_model, model provides this via property
    is_archived: Optional[bool] = None
    is_pinned: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="updated_at")
    sort_order: str = Field(default="desc")

    @validator('sort_by')
    def validate_sort_by(cls, v):
        # Only allow fields that actually exist in the database schema
        allowed_fields = ['created_at', 'updated_at', 'title', 'last_message_at']
        if v not in allowed_fields:
            raise ValueError(f'sort_by must be one of: {", ".join(allowed_fields)}')
        return v

    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('sort_order must be either "asc" or "desc"')
        return v

class BulkConversationAction(BaseModel):
    """Schema for bulk conversation actions."""
    conversation_ids: List[int]
    action: str

    @validator('action')
    def validate_action(cls, v):
        allowed_actions = ['archive', 'unarchive', 'delete', 'pin', 'unpin']
        if v not in allowed_actions:
            raise ValueError(f'Action must be one of: {", ".join(allowed_actions)}')
        return v
