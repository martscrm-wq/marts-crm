from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.users.service import create_user, authenticate_user, get_user_by_id
from app.modules.users.schemas import UserCreate
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.exceptions import UnauthorizedException, ConflictException
from app.modules.users.models import User


async def register_user(db: AsyncSession, email: str, password: str, full_name: str, locale: str = "en") -> User:
    data = UserCreate(email=email, password=password, full_name=full_name, locale=locale)
    return await create_user(db, data)


async def login_user(db: AsyncSession, email: str, password: str) -> dict:
    user = await authenticate_user(db, email, password)
    if not user:
        raise UnauthorizedException("Invalid email or password")
    access = create_access_token(str(user.id), user.role)
    refresh = create_refresh_token(str(user.id))
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> dict:
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid refresh token")
    user = await get_user_by_id(db, payload["sub"])
    access = create_access_token(str(user.id), user.role)
    refresh = create_refresh_token(str(user.id))
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}
