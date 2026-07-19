from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.modules.users.schemas import UserResponse, UserUpdate
from app.modules.users.service import get_user_by_id, update_user, list_users
from app.modules.users.models import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserResponse)
async def update_me(data: UserUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await update_user(db, user.id, data)


@router.get("/", response_model=list[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    return await list_users(db, skip, limit)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "staff")),
):
    return await get_user_by_id(db, user_id)
