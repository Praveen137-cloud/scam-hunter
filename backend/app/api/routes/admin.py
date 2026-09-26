from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.database.connection import get_db
from app.core.security import get_current_admin
from app.schemas.schemas import UserResponse, AnalysisResponse, AdminStats
from app.services.user_service import get_all_users, get_user_count, delete_user
from app.services.analysis_service import get_all_analyses_admin, get_admin_stats, delete_analysis
from app.models.analysis import Analysis

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStats)
async def admin_stats(
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    return await get_admin_stats(db)


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    return await get_all_users(db, skip, limit)


@router.delete("/users/{user_id}")
async def remove_user(
    user_id: int,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    deleted = await delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}


@router.get("/analyses", response_model=List[AnalysisResponse])
async def list_all_analyses(
    skip: int = 0,
    limit: int = 50,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    return await get_all_analyses_admin(db, skip, limit)


@router.delete("/analyses/{analysis_id}")
async def admin_delete_analysis(
    analysis_id: int,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    await db.delete(analysis)
    await db.flush()
    return {"message": "Analysis deleted"}
