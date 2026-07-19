from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password
from app.core.exceptions import NotFoundException, ConflictException


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise ConflictException("Email already registered")
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        locale=data.locale,
    )
    db.add(user)
    await db.flush()
    return user


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


async def update_user(db: AsyncSession, user_id: UUID, data: UserUpdate) -> User:
    user = await get_user_by_id(db, user_id)
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.locale is not None:
        user.locale = data.locale
    await db.flush()
    return user


async def list_users(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[User]:
    result = await db.execute(select(User).offset(skip).limit(limit))
    return list(result.scalars().all())
