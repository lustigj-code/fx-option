"""Pydantic models for authentication."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """Base user fields."""

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """User creation request."""

    password: str = Field(..., min_length=8, max_length=100)
    role: str = Field(default="client", pattern="^(client|operator|admin)$")


class UserLogin(BaseModel):
    """User login request."""

    username: str
    password: str


class UserUpdate(BaseModel):
    """User update request."""

    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = Field(None, pattern="^(client|operator|admin)$")


class UserResponse(UserBase):
    """User response (safe for API)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool
    is_superuser: bool
    role: str
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None


class Token(BaseModel):
    """JWT token response."""

    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenData(BaseModel):
    """Data encoded in JWT token."""

    user_id: str
    username: str
    role: str
    exp: datetime


class PasswordChange(BaseModel):
    """Password change request."""

    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
