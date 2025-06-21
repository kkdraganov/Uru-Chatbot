from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List

from app.db.base import Base, TimestampMixin


class Conversation(Base, TimestampMixin):
    """Conversation model matching existing database schema."""

    __tablename__ = "conversations"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign key to user
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Conversation metadata - matching existing schema
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)  # Database has 'model', not 'ai_model'
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Organization flags
    is_archived: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    is_pinned: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Statistics - additional columns from existing schema
    message_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    estimated_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Activity tracking
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="conversations")
    messages: Mapped[List["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )

    # Compatibility property for ai_model (frontend expects this)
    @property
    def ai_model(self) -> str:
        """Compatibility property for ai_model field."""
        return self.model

    @ai_model.setter
    def ai_model(self, value: str) -> None:
        """Compatibility setter for ai_model field."""
        self.model = value

    def __repr__(self) -> str:
        return f"<Conversation(id={self.id}, title='{self.title}', user_id={self.user_id})>"
