from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import require_role
from app.modules.users.models import User
from app.modules.customers.models import Subscription

router = APIRouter(prefix="/billing", tags=["Billing"])


class SubscriptionCreate(BaseModel):
    customer_id: str
    plan: str = "free"


@router.post("/subscriptions")
async def create_subscription(data: SubscriptionCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_role("admin"))):
    sub = Subscription(customer_id=data.customer_id, plan=data.plan)
    db.add(sub)
    await db.flush()
    return {"id": str(sub.id), "plan": sub.plan}
