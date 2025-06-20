from sqlalchemy import String, Boolean, DateTime, JSON, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, Dict, Any, List

from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """User model for simple email/password authentication with SSO migration readiness."""

    __tablename__ = "users"
    __table_args__ = (
        Index('ix_users_email_lower', func.lower('email'), unique=True),
    )

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Authentication fields
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile fields
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # User preferences (JSON field for UI preferences, default model, theme, etc.)
    preferences: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Activity tracking
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    conversations: Mapped[List["Conversation"]] = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="Conversation.created_at.desc()"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"
