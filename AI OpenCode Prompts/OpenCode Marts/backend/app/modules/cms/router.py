from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import get_current_user
from app.modules.users.models import User
from app.modules.cms.models import CmsSite

router = APIRouter(prefix="/cms", tags=["CMS"])


class SiteCreate(BaseModel):
    name: str
    platform: str = "custom"
    domain: str = ""


@router.post("/sites")
async def create_site(data: SiteCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    site = CmsSite(name=data.name, platform=data.platform, domain=data.domain, created_by=user.id)
    db.add(site)
    await db.flush()
    return {"id": str(site.id), "name": site.name, "platform": site.platform}
