from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class MessageBase(BaseModel):
    """Base message schema."""
    role: str
    content: str


class ChatRequest(BaseModel):
    """Chat request schema."""
    conversationId: str
    message: str
    apiKey: str
    model: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response schema."""
    message: str
    conversationId: str


class ValidateKeyRequest(BaseModel):
    """API key validation request schema."""
    apiKey: str


class ValidateKeyResponse(BaseModel):
    """API key validation response schema."""
    valid: bool
    models: Optional[List[str]] = None
