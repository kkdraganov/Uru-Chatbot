from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Message(Base):
    """Message metadata model - stores only metadata, not content."""
    
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content_hash = Column(String(64), nullable=True)  # SHA-256 hash for deduplication
    token_count = Column(Integer, default=0)
    ai_model = Column(String(100), nullable=True)  # Model used for this message (for assistant messages)
    cost_estimate = Column(Float, default=0.0)  # Cost for this specific message
    processing_time = Column(Float, nullable=True)  # Time taken to generate response (seconds)
    is_error = Column(Boolean, default=False)
    error_type = Column(String(100), nullable=True)  # Type of error if any
    message_metadata = Column(Text, nullable=True)  # JSON metadata for additional info
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    
    @property
    def is_user_message(self) -> bool:
        """Check if this is a user message."""
        return self.role == "user"
    
    @property
    def is_assistant_message(self) -> bool:
        """Check if this is an assistant message."""
        return self.role == "assistant"
    
    @property
    def is_system_message(self) -> bool:
        """Check if this is a system message."""
        return self.role == "system"
    
    def __repr__(self) -> str:
        return f"<Message(id={self.id}, conversation_id={self.conversation_id}, role='{self.role}')>"
