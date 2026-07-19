from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.modules.users.models import User
from app.modules.inbox.models import InboxMessage

router = APIRouter(prefix="/inbox", tags=["Inbox"])


@router.get("/messages")
async def list_messages(
    channel: str | None = None,
    is_read: bool | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(InboxMessage)
    if channel:
        q = q.where(InboxMessage.channel == channel)
    if is_read is not None:
        q = q.where(InboxMessage.is_read == is_read)
    q = q.offset(skip).limit(limit).order_by(InboxMessage.created_at.desc())
    result = await db.execute(q)
    return [
        {
            "id": str(row.id),
            "channel": row.channel,
            "direction": row.direction,
            "content": row.content[:200],
            "is_read": row.is_read,
            "created_at": row.created_at.isoformat(),
        }
        for row in result.scalars().all()
    ]


@router.put("/messages/{message_id}/read")
async def mark_read(message_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(InboxMessage).where(InboxMessage.id == message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        return {"error": "not found"}
    msg.is_read = True
    await db.flush()
    return {"status": "ok"}
