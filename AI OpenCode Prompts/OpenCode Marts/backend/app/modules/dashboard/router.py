from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import require_role
from app.modules.users.models import User
from app.modules.agents.models import Agent, Conversation, Message

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db), user: User = Depends(require_role("admin", "staff"))):
    total_users = await db.scalar(select(func.count(User.id)))
    total_agents = await db.scalar(select(func.count(Agent.id)))
    total_convs = await db.scalar(select(func.count(Conversation.id)))
    total_msgs = await db.scalar(select(func.count(Message.id)))
    return {
        "total_users": total_users or 0,
        "total_agents": total_agents or 0,
        "total_conversations": total_convs or 0,
        "total_messages": total_msgs or 0,
    }
