from sqlalchemy import String, Boolean, DateTime, Index, func
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
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile fields
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Additional fields to match database
    role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_verified: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Account status
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

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
    def name(self) -> str:
        """Get full name from first_name and last_name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        else:
            return self.display_email.split('@')[0]  # Fallback to email username

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
