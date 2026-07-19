from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.auth.schemas import LoginRequest, RegisterRequest, RefreshRequest, TokenResponse
from app.modules.auth.service import login_user, register_user, refresh_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, data.email, data.password, data.full_name, data.locale)
    return {"id": str(user.id), "email": user.email, "full_name": user.full_name}


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_user(db, data.email, data.password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await refresh_access_token(db, data.refresh_token)
