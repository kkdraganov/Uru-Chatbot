from pydantic import BaseModel, Field, ConfigDict, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class MessageSender(str, Enum):
    """Message sender enumeration matching DATABASE_OVERVIEW.md specification."""
    USER = "user"
    AI = "ai"
    SYSTEM = "system"


class MessageBase(BaseModel):
    """Base message schema matching DATABASE_OVERVIEW.md specification."""
    sender: MessageSender
    content: str = Field(..., min_length=1)


class MessageCreate(MessageBase):
    """Schema for creating a message."""
    conversation_id: int = Field(..., gt=0)
    ai_model: Optional[str] = Field(None, max_length=100)
    is_error: bool = False
    error_details: Optional[Dict[str, Any]] = None

    @validator('content')
    def content_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Message content cannot be empty')
        return v.strip()


class MessageUpdate(BaseModel):
    """Schema for updating a message."""
    content: Optional[str] = Field(None, min_length=1)
    is_error: Optional[bool] = None
    error_details: Optional[Dict[str, Any]] = None

    @validator('content')
    def content_not_empty(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Message content cannot be empty')
        return v.strip() if v else v


class MessageInDBBase(MessageBase):
    """Base schema for Message in DB."""
    id: int
    conversation_id: int
    content_hash: Optional[str] = None
    ai_model: Optional[str] = None
    is_error: bool = False
    error_details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Message(MessageInDBBase):
    """Message schema for API responses."""
    pass


class MessageInDB(MessageInDBBase):
    """Message schema with all database fields."""
    pass


class MessageResponse(MessageBase):
    """Schema for message API responses."""
    id: int
    conversation_id: int
    content_hash: Optional[str] = None
    ai_model: Optional[str] = None
    is_error: bool = False
    error_details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class MessageList(BaseModel):
    """Schema for paginated message lists."""
    messages: List[MessageResponse]
    total: int
    page: int = 1
    per_page: int = 50
    has_next: bool = False
    has_prev: bool = False

    model_config = ConfigDict(from_attributes=True)
