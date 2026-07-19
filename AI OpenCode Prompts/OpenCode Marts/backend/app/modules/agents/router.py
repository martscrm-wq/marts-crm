from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.modules.agents.schemas import AgentCreate, AgentUpdate, AgentResponse, ChatRequest, ChatResponse
from app.modules.agents.service import (
    create_agent, get_agent, list_agents, update_agent, delete_agent,
    add_training_data, list_training_data, delete_training_data, chat_with_agent,
)
from app.modules.users.models import User

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.post("/", response_model=AgentResponse, status_code=201)
async def create(data: AgentCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await create_agent(db, data, user.id)


@router.get("/", response_model=list[AgentResponse])
async def list_all(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await list_agents(db, skip, limit)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get(agent_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await get_agent(db, agent_id)


@router.put("/{agent_id}", response_model=AgentResponse)
async def update(agent_id: str, data: AgentUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await update_agent(db, agent_id, data)


@router.delete("/{agent_id}", status_code=204)
async def delete(agent_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    await delete_agent(db, agent_id)


@router.post("/{agent_id}/training", status_code=201)
async def upload_training(
    agent_id: str,
    file: UploadFile | None = File(None),
    content_text: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if file and file.filename:
        raw = await file.read()
        text = raw.decode("utf-8", errors="ignore")
        file_type = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "txt"
    else:
        text = content_text or ""
        file_type = "txt"
    return await add_training_data(db, agent_id, file_type, text)


@router.get("/{agent_id}/training")
async def get_training(agent_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await list_training_data(db, agent_id)


@router.delete("/{agent_id}/training/{training_id}", status_code=204)
async def delete_training(agent_id: str, training_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    await delete_training_data(db, training_id)


@router.post("/{agent_id}/chat", response_model=ChatResponse)
async def chat(agent_id: str, req: ChatRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    reply, conv_id, tokens = await chat_with_agent(db, agent_id, req.message)
    return ChatResponse(conversation_id=conv_id, reply=reply, tokens_used=tokens)
