from pydantic import BaseModel, EmailStr, Field, ConfigDict, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    USER = "user"
    VIEWER = "viewer"

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    """Enhanced user creation schema."""
    password: str = Field(..., min_length=8, max_length=100)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserUpdate(BaseModel):
    """Enhanced user update schema."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)

class UserInDBBase(UserBase):
    """Base schema for User in DB."""
    id: int
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    full_name: str

    model_config = ConfigDict(from_attributes=True)

class User(UserInDBBase):
    """Enhanced user schema for API responses."""
    pass

class UserInDB(UserInDBBase):
    """User schema with password hash."""
    hashed_password: str

class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str

class UserRegister(UserCreate):
    """Schema for user registration."""
    confirm_password: str

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class Token(BaseModel):
    """Enhanced token schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenPayload(BaseModel):
    """Enhanced token payload schema."""
    sub: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None
    scopes: List[str] = []

class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str

class UserStats(BaseModel):
    """User statistics schema."""
    total_conversations: int
    total_messages: int
    total_tokens: int
    estimated_total_cost: float
    last_activity: Optional[datetime] = None
