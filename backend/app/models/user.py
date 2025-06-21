from sqlalchemy import String, Boolean, DateTime, Index, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List

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

    # Profile fields - following DATABASE_OVERVIEW.md specification
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # User preferences (JSON field as per spec)
    preferences: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Activity tracking
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    conversations: Mapped[List["Conversation"]] = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="Conversation.created_at.desc()"
    )

    @property
    def first_name(self) -> str:
        """Get first name from name field for backward compatibility."""
        if self.name:
            return self.name.split()[0]
        return ""

    @property
    def last_name(self) -> str:
        """Get last name from name field for backward compatibility."""
        if self.name and len(self.name.split()) > 1:
            return " ".join(self.name.split()[1:])
        return ""

    @property
    def display_email(self) -> str:
        """Get the original email address, converting from Azure format if needed."""
        if "#EXT#@" in self.email:
            # Convert Azure external user format back to original email
            # alan_uruenterprises.com#EXT#@alanuruenterprises.onmicrosoft.com -> alan@uruenterprises.com
            parts = self.email.split("#EXT#@")
            if len(parts) == 2:
                original_email = parts[0].replace("_", "@", 1)  # Replace first underscore with @
                return original_email
        return self.email

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"
