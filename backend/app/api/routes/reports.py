from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
import io
from app.database.connection import get_db
from app.core.security import get_current_user
from app.models.report import Report
from app.models.analysis import Analysis
from app.schemas.schemas import ReportResponse
from app.reports.pdf_generator import generate_report_pdf
from app.services.analysis_service import get_analysis_by_id
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/{analysis_id}/generate", response_model=ReportResponse)
async def generate_report(
    analysis_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    analysis = await get_analysis_by_id(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    pdf_bytes = generate_report_pdf(analysis, current_user.username)

    report = Report(
        user_id=current_user.id,
        analysis_id=analysis_id,
        title=f"Report: {analysis.title}",
        file_size=len(pdf_bytes),
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


@router.get("/{analysis_id}/download")
async def download_report(
    analysis_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    analysis = await get_analysis_by_id(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    pdf_bytes = generate_report_pdf(analysis, current_user.username)
    filename = f"scam_report_{analysis_id}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/", response_model=List[ReportResponse])
async def list_reports(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Report)
        .where(Report.user_id == current_user.id)
        .order_by(desc(Report.created_at))
        .limit(50)
    )
    return result.scalars().all()
