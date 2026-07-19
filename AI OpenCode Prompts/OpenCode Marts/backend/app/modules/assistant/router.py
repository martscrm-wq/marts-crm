from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import get_current_user
from app.modules.users.models import User
from app.integrations.openai_client import get_ai_response

router = APIRouter(prefix="/assistant", tags=["Assistant"])


class AssistantRequest(BaseModel):
    query: str


class AssistantResponse(BaseModel):
    reply: str
    tokens_used: int


@router.post("/chat", response_model=AssistantResponse)
async def assistant_chat(req: AssistantRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    reply, tokens = await get_ai_response(
        req.query,
        "You are an executive assistant. Be concise, professional, and helpful. You can manage tasks, calendar events, and provide insights.",
        "",
        user.locale,
    )
    return AssistantResponse(reply=reply, tokens_used=tokens)
