from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Conversation(Base):
    """Enhanced conversation metadata model."""

    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    model = Column(String(100), nullable=False)
    system_prompt = Column(Text, nullable=True)  # Custom system prompt
    is_archived = Column(Boolean, default=False)
    is_pinned = Column(Boolean, default=False)
    message_count = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0)  # USD cost estimation
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

    @property
    def display_title(self) -> str:
        """Get display title, fallback to auto-generated if empty."""
        if self.title and self.title.strip():
            return self.title
        return f"Conversation {self.id}"

    @property
    def is_empty(self) -> bool:
        """Check if conversation has no messages."""
        return self.message_count == 0

    def update_stats(self, token_count: int = 0, cost: float = 0.0):
        """Update conversation statistics."""
        self.message_count += 1
        self.total_tokens += token_count
        self.estimated_cost += cost
        self.last_message_at = func.now()
        self.updated_at = func.now()
