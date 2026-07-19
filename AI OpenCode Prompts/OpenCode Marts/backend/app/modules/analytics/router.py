from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import require_role
from app.modules.users.models import User
from app.modules.agents.models import Message

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/events")
async def get_events(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    q = select(Message).offset(skip).limit(limit).order_by(Message.created_at.desc())
    result = await db.execute(q)
    return [
        {"id": str(r.id), "role": r.role, "content": r.content[:100], "created_at": r.created_at.isoformat()}
        for r in result.scalars().all()
    ]


@router.get("/agent-performance/{agent_id}")
async def agent_performance(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "staff")),
):
    total = await db.scalar(
        select(func.count(Message.id)).where(Message.conversation_id == agent_id)
    )
    return {"agent_id": agent_id, "total_messages": total or 0}
