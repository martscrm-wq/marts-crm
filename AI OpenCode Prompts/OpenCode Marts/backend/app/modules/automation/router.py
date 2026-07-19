from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.modules.users.models import User

router = APIRouter(prefix="/automation", tags=["Automation"])


@router.post("/cv-screen")
async def cv_screen(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    raw = await file.read()
    text = raw.decode("utf-8", errors="ignore")
    lines = [l for l in text.split("\n") if l.strip()]
    score = min(len(lines) * 5, 100)
    return {
        "filename": file.filename,
        "pages_approx": max(1, len(text) // 3000),
        "extracted_text": text[:500],
        "score": score,
        "verdict": "Strong Match" if score > 70 else "Potential Match" if score > 40 else "Review Required",
    }


@router.post("/screen")
async def screen_cv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await cv_screen(file, db, user)
