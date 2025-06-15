from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None


class UserInDBBase(UserBase):
    """Base schema for User in DB."""
    id: int
    is_active: bool
    role: str
    
    model_config = ConfigDict(from_attributes=True)


class User(UserInDBBase):
    """User schema for API responses."""
    pass


class UserInDB(UserInDBBase):
    """User schema with password hash."""
    hashed_password: str


class Token(BaseModel):
    """Token schema."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: Optional[str] = None
    scopes: List[str] = []
