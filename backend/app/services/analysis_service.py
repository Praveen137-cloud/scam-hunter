from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional, List
from datetime import datetime, date
from app.models.analysis import Analysis
from app.models.threat_log import ThreatIntelligenceLog
from app.utils.text_extractor import extract_all_entities
from app.services.threat_intelligence import (
    calculate_text_risk_score, classify_scam_type, run_threat_intelligence
)
from app.ai.ai_service import generate_ai_analysis


def determine_risk_level(score: float) -> str:
    if score <= 20:
        return "Safe"
    elif score <= 55:
        return "Medium"
    elif score <= 80:
        return "High"
    else:
        return "Critical"


async def run_analysis_pipeline(
    db: AsyncSession,
    user_id: int,
    input_type: str,
    text: str,
    title: Optional[str] = None,
    ocr_text: Optional[str] = None
) -> Analysis:
    """Full analysis pipeline: extract → score → classify → AI → store."""

    full_text = text
    if ocr_text:
        full_text = f"{text}\n{ocr_text}".strip()

    # Step 1: Extract entities
    entities = extract_all_entities(full_text)

    # Step 2: Calculate text risk score
    text_risk = calculate_text_risk_score(full_text, entities)
    base_score = text_risk["score"]
    indicators = text_risk["indicators"]

    # Step 3: Threat intelligence (async)
    threat_intel = {}
    if entities["urls"]:
        threat_intel = await run_threat_intelligence(entities["urls"], full_text)

    # Boost score from threat intel results
    for _target, result in threat_intel.items():
        for _source, data in result.items():
            if isinstance(data, dict) and data.get("is_malicious"):
                base_score = min(100, base_score + 20)
                indicators.append(f"Malicious URL detected by {_source}")

    # Step 4: Classify scam type
    classification = classify_scam_type(full_text, entities)
    scam_type = classification["type"]
    scam_confidence = classification["confidence"]

    # Boost score if a specific scam is detected with confidence
    if scam_type not in ["Safe", "Unknown"] and scam_confidence > 20:
        # Minimum score for a classified scam is 45 (Medium risk)
        base_score = max(base_score, 45.0)
        # Boost based on confidence
        base_score = min(100.0, base_score + (scam_confidence * 0.25))

    # Step 5: Generate AI explanation
    ai_result = await generate_ai_analysis(
        full_text, entities, base_score,
        scam_type, threat_intel
    )

    risk_level = determine_risk_level(base_score)

    # Step 6: Create analysis record
    analysis = Analysis(
        user_id=user_id,
        input_type=input_type,
        raw_input=text[:5000],
        extracted_text=full_text[:5000],
        extracted_urls=entities["urls"],
        extracted_emails=entities["emails"],
        extracted_phones=entities["phones"],
        extracted_upi_ids=entities["upi_ids"],
        extracted_crypto_wallets=entities["crypto_wallets"],
        risk_score=round(base_score, 2),
        risk_level=risk_level,
        scam_type=classification["type"],
        scam_confidence=classification["confidence"],
        ai_summary=ai_result.get("summary", ""),
        ai_technical_analysis=ai_result.get("technical_analysis", ""),
        ai_recommendations=ai_result.get("recommendations", ""),
        threat_indicators=ai_result.get("threat_indicators", indicators),
        attack_techniques=ai_result.get("attack_techniques", []),
        threat_intel_results=threat_intel,
        ocr_text=ocr_text,
        title=title or f"{input_type} Analysis - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)

    # Step 7: Log threat intel
    for target, result in threat_intel.items():
        for source, data in result.items():
            if isinstance(data, dict) and "risk_score" in data:
                log = ThreatIntelligenceLog(
                    analysis_id=analysis.id,
                    source=source,
                    target=target,
                    target_type="url" if target.startswith("http") else "ip",
                    result=data,
                    risk_score=data.get("risk_score", 0),
                    is_malicious=1 if data.get("is_malicious") else 0,
                )
                db.add(log)

    await db.flush()
    return analysis


async def get_analysis_by_id(db: AsyncSession, analysis_id: int, user_id: int) -> Optional[Analysis]:
    result = await db.execute(
        select(Analysis).where(Analysis.id == analysis_id, Analysis.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_user_analyses(
    db: AsyncSession, user_id: int,
    skip: int = 0, limit: int = 20,
    scam_type: Optional[str] = None,
    search: Optional[str] = None
) -> List[Analysis]:
    query = select(Analysis).where(Analysis.user_id == user_id)
    if scam_type:
        query = query.where(Analysis.scam_type == scam_type)
    if search:
        query = query.where(Analysis.title.ilike(f"%{search}%"))
    query = query.order_by(desc(Analysis.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_dashboard_stats(db: AsyncSession, user_id: int) -> dict:
    total = await db.execute(select(func.count(Analysis.id)).where(Analysis.user_id == user_id))
    total_count = total.scalar()

    risk_q = await db.execute(
        select(Analysis.risk_level, func.count(Analysis.id))
        .where(Analysis.user_id == user_id)
        .group_by(Analysis.risk_level)
    )
    risk_dist = {row[0]: row[1] for row in risk_q}

    scam_q = await db.execute(
        select(Analysis.scam_type, func.count(Analysis.id))
        .where(Analysis.user_id == user_id)
        .group_by(Analysis.scam_type)
    )
    scam_dist = {row[0]: row[1] for row in scam_q}

    recent_q = await db.execute(
        select(Analysis).where(Analysis.user_id == user_id)
        .order_by(desc(Analysis.created_at)).limit(5)
    )
    recent = recent_q.scalars().all()

    return {
        "total_analyses": total_count,
        "total_reports": 0,
        "critical_threats": risk_dist.get("Critical", 0),
        "high_threats": risk_dist.get("High", 0),
        "medium_threats": risk_dist.get("Medium", 0),
        "safe_count": risk_dist.get("Safe", 0),
        "scam_type_distribution": scam_dist,
        "risk_distribution": risk_dist,
        "recent_analyses": recent,
    }


async def delete_analysis(db: AsyncSession, analysis_id: int, user_id: int) -> bool:
    analysis = await get_analysis_by_id(db, analysis_id, user_id)
    if not analysis:
        return False
    await db.delete(analysis)
    await db.flush()
    return True


async def get_all_analyses_admin(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Analysis]:
    result = await db.execute(
        select(Analysis).order_by(desc(Analysis.created_at)).offset(skip).limit(limit)
    )
    return result.scalars().all()


async def get_admin_stats(db: AsyncSession) -> dict:
    from app.models.user import User
    from app.models.report import Report

    users = await db.execute(select(func.count(User.id)))
    analyses = await db.execute(select(func.count(Analysis.id)))
    reports = await db.execute(select(func.count(Report.id)))

    today = date.today()
    critical_today = await db.execute(
        select(func.count(Analysis.id)).where(
            Analysis.risk_level == "Critical",
            func.date(Analysis.created_at) == today
        )
    )

    return {
        "total_users": users.scalar(),
        "total_analyses": analyses.scalar(),
        "total_reports": reports.scalar(),
        "active_users_today": 0,
        "critical_threats_today": critical_today.scalar(),
    }
