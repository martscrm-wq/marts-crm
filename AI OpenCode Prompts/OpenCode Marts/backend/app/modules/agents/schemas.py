from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class AgentCreate(BaseModel):
    name: str
    description: str | None = None
    domain: str = "custom"
    locale: str = "en"
    system_prompt: str | None = None
    settings: dict = {}


class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    domain: str | None = None
    locale: str | None = None
    system_prompt: str | None = None
    settings: dict | None = None
    is_active: bool | None = None


class AgentResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    domain: str
    locale: str
    system_prompt: str | None
    settings: dict
    is_active: bool
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentTrainingCreate(BaseModel):
    file_type: str = "txt"
    content_text: str | None = None


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    tokens_used: int
