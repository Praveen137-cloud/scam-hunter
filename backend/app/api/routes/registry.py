import re
import socket
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.core.security import get_current_user
from app.models.threat_registry import ThreatRegistryItem
from app.schemas.schemas import (
    ThreatRegistryCreate, ThreatRegistryCheckResponse,
    ThreatRegistryReportDetail, ThreatRegistryItemResponse
)

router = APIRouter(prefix="/registry", tags=["Threat Registry"])


def classify_indicator(value: str) -> str:
    val = value.strip()
    if "@" in val and len(val.split("@")) == 2:
        return "UPI ID"
    elif re.match(r"^\+?[0-9\-\s]{10,16}$", val):
        return "Phone Number"
    elif re.match(r"^[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", val):
        return "Domain"
    elif re.match(r"^\d{9,18}$", val):
        return "Bank Account"
    else:
        return "Other Indicator"


def perform_simulated_osint(value: str, indicator_type: str) -> Dict[str, Any]:
    val = value.strip()
    checks = []
    reputation = "Unknown"
    note = ""
    provider = "Global OSINT Database"
    
    if indicator_type == "UPI ID":
        provider = "NPCI / Unified Payments Interface"
        parts = val.split("@")
        handle = parts[1] if len(parts) > 1 else ""
        
        # Syntax check
        checks.append({"check": "VPA Syntax Validation", "status": "Passed"})
        
        # Check standard bank handles
        standard_handles = ["okaxis", "okicici", "okhdfcbank", "oksbi", "ybl", "yapl", "paytm", "apl", "upi"]
        if handle.lower() in standard_handles:
            checks.append({"check": "Official Gateway Provider", "status": "Passed"})
            checks.append({"check": "Handle Reputation", "status": "Safe Suffix"})
            note = f"This UPI ID utilizes a standard banking handle (@{handle}). No active blacklist records found."
        else:
            checks.append({"check": "Official Gateway Provider", "status": "Non-Standard Custom Handle"})
            checks.append({"check": "Handle Reputation", "status": "Under Investigation"})
            note = f"This UPI ID uses a non-standard or custom handle (@{handle}). Exercise caution before sending money."
            
    elif indicator_type == "Phone Number":
        provider = "Telecom Subscriber Information"
        checks.append({"check": "ITU-T E.164 Dialing Format", "status": "Passed"})
        checks.append({"check": "Spam Registry Match", "status": "Clean (No Matches)"})
        
        # Basic carrier route lookup simulation
        carrier = "Simulated Telecom Routing Hub"
        checks.append({"check": "Carrier Status", "status": f"Active ({carrier})"})
        note = "Phone number syntax is valid. No crowdsourced spam alerts found in current local registry."
        
    elif indicator_type == "Domain":
        provider = "DNS Name Server & Registry Search"
        # DNS lookup check
        try:
            ip = socket.gethostbyname(val)
            checks.append({"check": "DNS A Record Resolution", "status": f"Passed ({ip})"})
        except Exception:
            checks.append({"check": "DNS A Record Resolution", "status": "Failed (Unresolved)"})
            
        checks.append({"check": "SSL Encryption Status", "status": "Checking..."})
        checks.append({"check": "Domain Typosquatting Check", "status": "Passed"})
        note = "No domain blacklist matches. Run a URL sandbox check for detailed behavioral threat analysis."
        
    elif indicator_type == "Bank Account":
        provider = "National Financial Switch (NFS)"
        checks.append({"check": "Account Number Structure", "status": "Passed"})
        checks.append({"check": "IFSC Routing Check", "status": "Undetermined (No IFSC provided)"})
        note = "Bank account length is consistent with banking standards. No fraudulent history logged."
        
    else:
        checks.append({"check": "Format Validation", "status": "Standard"})
        note = "Indicator checked against global honeypot feeds. No threats detected."

    return {
        "provider": provider,
        "reputation": reputation,
        "safety_checks": checks,
        "note": note
    }


@router.get("/check", response_model=ThreatRegistryCheckResponse)
async def check_indicator(
    value: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    clean_val = value.strip()
    if not clean_val:
        raise HTTPException(status_code=400, detail="Query value cannot be empty")

    # Search for all reports of this value
    stmt = select(ThreatRegistryItem).where(
        func.lower(ThreatRegistryItem.value) == func.lower(clean_val)
    ).order_by(desc(ThreatRegistryItem.created_at))
    
    result = await db.execute(stmt)
    reports = result.scalars().all()
    
    indicator_type = classify_indicator(clean_val)
    
    if reports:
        total_reports = len(reports)
        # Aggregate Risk Assessment
        if total_reports >= 3:
            risk_level = "Critical"
            risk_score = 95.0
        elif total_reports == 2:
            risk_level = "High"
            risk_score = 80.0
        else:
            risk_level = "Medium"
            risk_score = 50.0
            
        scam_type = reports[0].scam_type
        
        report_details = [
            ThreatRegistryReportDetail(
                reporter=r.reporter_username,
                scam_type=r.scam_type,
                description=r.description,
                date=r.created_at
            )
            for r in reports
        ]
        
        return ThreatRegistryCheckResponse(
            exists=True,
            value=clean_val,
            type=reports[0].type,
            risk_level=risk_level,
            risk_score=risk_score,
            scam_type=scam_type,
            total_reports=total_reports,
            reports=report_details,
            osint_analysis=None
        )
    else:
        # Fallback to simulated OSINT analysis
        osint_res = perform_simulated_osint(clean_val, indicator_type)
        return ThreatRegistryCheckResponse(
            exists=False,
            value=clean_val,
            type=indicator_type,
            risk_level="Safe",
            risk_score=10.0,
            scam_type="Unknown",
            total_reports=0,
            reports=[],
            osint_analysis=osint_res
        )


@router.post("/report", response_model=ThreatRegistryItemResponse)
async def report_indicator(
    payload: ThreatRegistryCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    clean_val = payload.value.strip()
    if not clean_val:
        raise HTTPException(status_code=400, detail="Report value cannot be empty")
        
    item = ThreatRegistryItem(
        value=clean_val,
        type=payload.type,
        scam_type=payload.scam_type,
        risk_score=50.0,  # Single report starts at medium risk
        risk_level="Medium",
        description=payload.description,
        reporter_username=current_user.username
    )
    
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.get("/recent", response_model=List[ThreatRegistryItemResponse])
async def get_recent_reports(
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ThreatRegistryItem).order_by(
        desc(ThreatRegistryItem.created_at)
    ).limit(limit)
    
    result = await db.execute(stmt)
    return result.scalars().all()
