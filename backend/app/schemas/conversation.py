from pydantic import BaseModel, Field, ConfigDict, validator
from typing import Optional, List, Dict
from datetime import datetime

class ConversationBase(BaseModel):
    """Enhanced base conversation schema."""
    title: str = Field(..., min_length=1, max_length=255)
    model: str
    system_prompt: Optional[str] = None

class ConversationCreate(ConversationBase):
    """Enhanced conversation creation schema."""
    pass

class ConversationUpdate(BaseModel):
    """Enhanced conversation update schema."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    is_archived: Optional[bool] = None
    is_pinned: Optional[bool] = None

class ConversationInDBBase(ConversationBase):
    """Enhanced base schema for Conversation in DB."""
    id: int
    user_id: int
    is_archived: bool = False
    is_pinned: bool = False
    message_count: int = 0
    total_tokens: int = 0
    estimated_cost: float = 0.0
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    display_title: str
    is_empty: bool

    model_config = ConfigDict(from_attributes=True)

class Conversation(ConversationInDBBase):
    """Enhanced conversation schema for API responses."""
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
    model: Optional[str] = None
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
        allowed_fields = ['created_at', 'updated_at', 'title', 'message_count', 'total_tokens']
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
