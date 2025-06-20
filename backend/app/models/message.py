from sqlalchemy import String, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, Dict, Any

from app.db.base import Base


class Message(Base):
    """Message model for storing chat messages between user and AI model."""

    __tablename__ = "messages"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign key to conversation
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)

    # Message metadata
    sender: Mapped[str] = mapped_column(String(20), nullable=False)  # user, ai, system
    content: Mapped[str] = mapped_column(Text, nullable=False)  # The actual message content
    content_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # SHA-256 hash for deduplication

    # AI-specific fields
    ai_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # AI model that generated response (for AI messages)

    # Error handling
    is_error: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    error_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # Error information if message failed

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")

    @property
    def is_user_message(self) -> bool:
        """Check if this is a user message."""
        return self.sender == "user"

    @property
    def is_ai_message(self) -> bool:
        """Check if this is an AI message."""
        return self.sender == "ai"

    @property
    def is_system_message(self) -> bool:
        """Check if this is a system message."""
        return self.sender == "system"

    def __repr__(self) -> str:
        return f"<Message(id={self.id}, conversation_id={self.conversation_id}, sender='{self.sender}')>"
