from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    locale: str = "en"

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserUpdate(BaseModel):
    full_name: str | None = None
    locale: str | None = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    locale: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
