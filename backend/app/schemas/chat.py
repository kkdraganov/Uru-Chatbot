from pydantic import BaseModel, Field, validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    """Message role enumeration."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class MessageBase(BaseModel):
    """Base message schema."""
    role: MessageRole
    content: str

class MessageCreate(MessageBase):
    """Schema for creating a message."""
    pass

class MessageResponse(MessageBase):
    """Schema for message response."""
    id: int
    conversation_id: int
    token_count: int
    ai_model: Optional[str] = None
    cost_estimate: float = 0.0
    processing_time: Optional[float] = None
    is_error: bool = False
    error_type: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class ChatRequest(BaseModel):
    """Enhanced chat request schema."""
    conversation_id: int
    message: str
    api_key: str
    model: Optional[str] = "gpt-4o"
    system_prompt: Optional[str] = None
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, gt=0, le=4096)
    stream: bool = True

    @validator('message')
    def message_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()

class ChatResponse(BaseModel):
    """Enhanced chat response schema."""
    message: str
    conversation_id: int
    message_id: int
    token_count: int
    cost_estimate: float
    processing_time: float
    ai_model: str

class StreamChunk(BaseModel):
    """Schema for streaming response chunks."""
    content: str
    is_complete: bool = False
    token_count: Optional[int] = None
    error: Optional[str] = None

class ValidateKeyRequest(BaseModel):
    """API key validation request schema."""
    api_key: str

class ValidateKeyResponse(BaseModel):
    """Enhanced API key validation response schema."""
    valid: bool
    models: Optional[List[str]] = None
    organization: Optional[str] = None
    usage_limit: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ModelInfo(BaseModel):
    """Model information schema."""
    id: str
    name: str
    description: str
    context_length: int
    input_cost_per_token: float
    output_cost_per_token: float
    supports_streaming: bool = True

class AvailableModelsResponse(BaseModel):
    """Available models response schema."""
    models: List[ModelInfo]
    default_model: str
