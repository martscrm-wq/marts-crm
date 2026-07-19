import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    domain: Mapped[str] = mapped_column(String(50), nullable=False, default="custom")
    locale: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    system_prompt: Mapped[str | None] = mapped_column(Text)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )


class AgentTrainingData(Base):
    __tablename__ = "agent_training_data"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(500))
    content_hash: Mapped[str | None] = mapped_column(String(64))
    content_text: Mapped[str | None] = mapped_column(Text)
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("agents.id"), nullable=False)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("customers.id"))
    channel: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    extra_data: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    extra_data: Mapped[dict] = mapped_column(JSON, default=dict)
    tokens_used: Mapped[int | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
