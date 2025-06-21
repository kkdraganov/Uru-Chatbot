from pydantic import BaseModel, EmailStr, Field, ConfigDict, validator
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    """Base user schema matching DATABASE_OVERVIEW.md specification."""
    email: EmailStr
    name: str = Field(..., max_length=255)

class UserCreate(UserBase):
    """User creation schema."""
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
    """User update schema."""
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    preferences: Optional[dict] = None
    password: Optional[str] = Field(None, min_length=8)

class UserInDBBase(UserBase):
    """Base schema for User in DB."""
    id: int
    is_active: bool = True
    preferences: Optional[dict] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class User(UserInDBBase):
    """User schema for API responses."""
    pass

class UserInDB(UserInDBBase):
    """User schema with password hash."""
    password_hash: str

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

# UserStats removed - not part of DATABASE_OVERVIEW.md specification
