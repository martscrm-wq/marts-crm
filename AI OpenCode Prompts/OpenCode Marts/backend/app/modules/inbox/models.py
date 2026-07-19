import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class InboxMessage(Base):
    __tablename__ = "inbox_messages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    channel: Mapped[str] = mapped_column(String(50), nullable=False)
    channel_message_id: Mapped[str | None] = mapped_column(String(255))
    customer_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("customers.id"))
    direction: Mapped[str] = mapped_column(String(10), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    extra_data: Mapped[dict] = mapped_column(JSON, default=dict)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
