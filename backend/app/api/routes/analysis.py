from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.database.connection import get_db
from app.core.security import get_current_user
from app.schemas.schemas import AnalysisResponse, DashboardStats
from app.services.analysis_service import (
    run_analysis_pipeline, get_analysis_by_id, get_user_analyses,
    get_dashboard_stats, delete_analysis
)
from app.services.takedown_service import compile_takedown_dossier
from app.ocr.ocr_service import extract_text_from_image, validate_image, preprocess_image
from app.core.config import settings

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("/text", response_model=AnalysisResponse)
async def analyze_text(
    raw_input: str = Form(...),
    input_type: str = Form(default="Text"),
    title: Optional[str] = Form(default=None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if len(raw_input.strip()) < 5:
        raise HTTPException(status_code=400, detail="Input too short")
    analysis = await run_analysis_pipeline(
        db=db,
        user_id=current_user.id,
        input_type=input_type,
        text=raw_input,
        title=title
    )
    return analysis


@router.post("/image", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    title: Optional[str] = Form(default=None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted")

    image_bytes = await file.read()
    valid, msg = validate_image(image_bytes, settings.MAX_FILE_SIZE_MB)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    preprocessed = preprocess_image(image_bytes)
    ocr_text, confidence = extract_text_from_image(preprocessed)

    analysis = await run_analysis_pipeline(
        db=db,
        user_id=current_user.id,
        input_type="Image",
        text=f"[Image file: {file.filename}]",
        title=title or f"Image Analysis: {file.filename}",
        ocr_text=ocr_text
    )
    return analysis


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stats = await get_dashboard_stats(db, current_user.id)
    return stats


@router.get("/history", response_model=List[AnalysisResponse])
async def get_history(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    scam_type: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_user_analyses(db, current_user.id, skip, limit, scam_type, search)


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    analysis = await get_analysis_by_id(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


@router.delete("/{analysis_id}")
async def remove_analysis(
    analysis_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deleted = await delete_analysis(db, analysis_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"message": "Deleted successfully"}


@router.post("/{analysis_id}/takedown")
async def generate_takedown(
    analysis_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    analysis = await get_analysis_by_id(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    dossier = await compile_takedown_dossier(analysis)
    return dossier


from app.services.sandbox_service import run_url_sandbox_analysis
from app.models.analysis import Analysis

@router.post("/sandbox")
async def analyze_sandbox_url(
    url: str = Form(...),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty")
        
    result = await run_url_sandbox_analysis(url)
    
    analysis = Analysis(
        user_id=current_user.id,
        input_type="URL",
        raw_input=url,
        extracted_text=f"Live Sandbox Scan of URL: {url}\nDomain: {result['domain']}\nTitle: {result['page_title']}\nIP: {result['ip_address']}\nRegistrar: {result['registrar']}",
        extracted_urls=[url],
        extracted_emails=[],
        extracted_phones=[],
        extracted_upi_ids=[],
        extracted_crypto_wallets=[],
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        scam_type=result["scam_type"],
        scam_confidence=85.0 if result["risk_score"] > 20 else 0.0,
        ai_summary=f"Secure URL sandbox analysis completed for {url}. The site resolved to IP {result['ip_address']} hosted by {result['geo_location'].get('isp', 'Unknown')} located in {result['geo_location'].get('country', 'Unknown')}.",
        ai_technical_analysis=f"Domain: {result['domain']}\nRegistrar: {result['registrar']}\nSSL Status: {result['ssl_status']}\nSSL Issuer: {result['ssl_issuer']}\nHTTP Status: {result['status_code']}",
        ai_recommendations="Avoid submitting any sensitive credentials, PINs, or financial details on this domain immediately." if result["risk_score"] > 20 else "No active indicators of compromise were flagged, but exercise standard caution.",
        threat_indicators=result["threat_indicators"],
        attack_techniques=["Credential Harvesting"] if len(result["extracted_forms"]) > 0 else [],
        threat_intel_results={"sandbox": result},
        ocr_text=None,
        title=f"Sandbox URL Scan: {result['domain']}",
    )
    
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)
    
    return {
        "analysis_id": analysis.id,
        "record": analysis,
        "sandbox_details": result
    }
