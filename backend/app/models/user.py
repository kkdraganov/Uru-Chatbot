from sqlalchemy import String, Boolean, DateTime, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, List

from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """User model matching existing database schema."""

    __tablename__ = "users"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Authentication fields - matching existing schema
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile fields - matching existing schema
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Account status
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    is_verified: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Role field from existing schema
    role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Activity tracking
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Properties to maintain compatibility with the expected interface
    @property
    def password_hash(self) -> str:
        """Compatibility property for password_hash."""
        return self.hashed_password

    @password_hash.setter
    def password_hash(self, value: str):
        """Compatibility setter for password_hash."""
        self.hashed_password = value

    @property
    def name(self) -> str:
        """Compatibility property for name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        else:
            return self.email

    @name.setter
    def name(self, value: str):
        """Compatibility setter for name."""
        if value:
            parts = value.split(' ', 1)
            self.first_name = parts[0] if parts else ''
            self.last_name = parts[1] if len(parts) > 1 else ''
        else:
            self.first_name = ''
            self.last_name = ''

    @property
    def preferences(self) -> Optional[dict]:
        """Compatibility property for preferences (not stored in DB yet)."""
        return None

    @preferences.setter
    def preferences(self, value: Optional[dict]):
        """Compatibility setter for preferences (no-op for now)."""
        pass

    # Relationships
    conversations: Mapped[List["Conversation"]] = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="Conversation.created_at.desc()"
    )



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
