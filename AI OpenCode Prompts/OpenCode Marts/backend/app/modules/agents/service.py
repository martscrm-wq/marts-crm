import uuid
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.modules.agents.models import Agent, AgentTrainingData, Conversation, Message
from app.modules.agents.schemas import AgentCreate, AgentUpdate
from app.core.exceptions import NotFoundException
from app.integrations.openai_client import get_ai_response


async def create_agent(db: AsyncSession, data: AgentCreate, user_id: uuid.UUID) -> Agent:
    agent = Agent(
        name=data.name,
        description=data.description,
        domain=data.domain,
        locale=data.locale,
        system_prompt=data.system_prompt,
        settings=data.settings,
        created_by=user_id,
    )
    db.add(agent)
    await db.flush()
    return agent


async def get_agent(db: AsyncSession, agent_id: uuid.UUID) -> Agent:
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise NotFoundException("Agent not found")
    return agent


async def list_agents(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Agent]:
    result = await db.execute(select(Agent).offset(skip).limit(limit))
    return list(result.scalars().all())


async def update_agent(db: AsyncSession, agent_id: uuid.UUID, data: AgentUpdate) -> Agent:
    agent = await get_agent(db, agent_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)
    await db.flush()
    return agent


async def delete_agent(db: AsyncSession, agent_id: uuid.UUID) -> None:
    agent = await get_agent(db, agent_id)
    await db.delete(agent)
    await db.flush()


async def add_training_data(db: AsyncSession, agent_id: uuid.UUID, file_type: str, content_text: str | None) -> AgentTrainingData:
    await get_agent(db, agent_id)
    content_hash = hashlib.sha256((content_text or "").encode()).hexdigest() if content_text else None
    td = AgentTrainingData(
        agent_id=agent_id,
        file_type=file_type,
        content_text=content_text,
        content_hash=content_hash,
        processed=True,
    )
    db.add(td)
    await db.flush()
    return td


async def list_training_data(db: AsyncSession, agent_id: uuid.UUID) -> list[AgentTrainingData]:
    result = await db.execute(select(AgentTrainingData).where(AgentTrainingData.agent_id == agent_id))
    return list(result.scalars().all())


async def delete_training_data(db: AsyncSession, training_id: uuid.UUID) -> None:
    result = await db.execute(delete(AgentTrainingData).where(AgentTrainingData.id == training_id))
    if result.rowcount == 0:
        raise NotFoundException("Training data not found")
    await db.flush()


async def chat_with_agent(db: AsyncSession, agent_id: uuid.UUID, message: str, customer_id: uuid.UUID | None = None) -> tuple[str, str, int]:
    agent = await get_agent(db, agent_id)
    result = await db.execute(
        select(AgentTrainingData.content_text).where(
            AgentTrainingData.agent_id == agent_id, AgentTrainingData.processed == True
        )
    )
    training_texts = [row[0] for row in result.all() if row[0]]
    context = "\n\n".join(training_texts) if training_texts else ""

    conv = Conversation(agent_id=agent_id, customer_id=customer_id, channel="api", status="active")
    db.add(conv)
    await db.flush()

    db.add(Message(conversation_id=conv.id, role="user", content=message))
    reply, tokens = await get_ai_response(message, agent.system_prompt or "", context, agent.locale)
    db.add(Message(conversation_id=conv.id, role="assistant", content=reply, tokens_used=tokens))
    await db.flush()

    return reply, str(conv.id), tokens
