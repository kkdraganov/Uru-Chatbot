from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, Dict, Any, Union
from datetime import datetime
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

class UserRepository:
    """Repository for user operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email (case-insensitive)."""
        query = select(User).where(func.lower(User.email) == func.lower(email))
        result = await self.session.execute(query)
        return result.scalars().first()
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        query = select(User).where(User.id == user_id)
        result = await self.session.execute(query)
        return result.scalars().first()
    
    async def create(self, data: Union[UserCreate, Dict[str, Any]]) -> User:
        """Create a new user."""
        if isinstance(data, dict):
            # Handle dict input - map to existing schema
            user = User(
                email=data["email"].lower(),  # Store email in lowercase for consistency
                hashed_password=data.get("password_hash", data.get("hashed_password", "")),
                is_active=data.get("is_active", True),
                is_verified=data.get("is_verified", False),
                role=data.get("role", "user")
            )
            # Set name using the property setter
            user.name = data.get("name", "")
        else:
            # Handle UserCreate schema
            user = User(
                email=data.email.lower(),  # Store email in lowercase for consistency
                hashed_password=get_password_hash(data.password),
                is_active=True,
                is_verified=False,
                role="user"
            )
            # Set name using the property setter
            user.name = data.name

        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def update(self, user_id: int, data: UserUpdate) -> Optional[User]:
        """Update user data."""
        user = await self.get_by_id(user_id)
        if not user:
            return None
        
        update_data = data.model_dump(exclude_unset=True)

        # Hash password if provided
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

        # Ensure email is stored in lowercase for consistency
        if "email" in update_data:
            update_data["email"] = update_data["email"].lower()

        for key, value in update_data.items():
            setattr(user, key, value)
        
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user."""
        user = await self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def update_last_login(self, user_id: int) -> Optional[User]:
        """Update user's last login timestamp."""
        user = await self.get_by_id(user_id)
        if not user:
            return None

        user.last_login = datetime.now()
        await self.session.commit()
        await self.session.refresh(user)
        return user
