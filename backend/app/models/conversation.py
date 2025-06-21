from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List

from app.db.base import Base, TimestampMixin


class Conversation(Base, TimestampMixin):
    """Conversation model for organizing chat sessions and tracking conversation metadata."""

    __tablename__ = "conversations"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign key to user
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Conversation metadata
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    ai_model: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "gpt-4o", "o1-preview"
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Organization flags
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

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

    @property
    def model(self) -> str:
        """Backward compatibility property for ai_model field."""
        return self.ai_model

    @model.setter
    def model(self, value: str) -> None:
        """Backward compatibility setter for ai_model field."""
        self.ai_model = value

    def __repr__(self) -> str:
        return f"<Conversation(id={self.id}, title='{self.title}', user_id={self.user_id})>"
