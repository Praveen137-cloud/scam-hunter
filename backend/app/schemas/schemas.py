from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None

    @validator("username")
    def username_alphanumeric(cls, v):
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username must be alphanumeric (underscores/hyphens allowed)")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    created_at: datetime
    last_login: Optional[datetime]
    avatar_url: Optional[str]
    bio: Optional[str]

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Analysis Schemas
class AnalysisCreate(BaseModel):
    input_type: str
    raw_input: Optional[str] = None
    title: Optional[str] = None


class AnalysisResponse(BaseModel):
    id: int
    user_id: int
    input_type: str
    raw_input: Optional[str]
    extracted_text: Optional[str]
    extracted_urls: List[str]
    extracted_emails: List[str]
    extracted_phones: List[str]
    extracted_upi_ids: List[str]
    extracted_crypto_wallets: List[str]
    risk_score: float
    risk_level: str
    scam_type: str
    scam_confidence: float
    ai_summary: Optional[str]
    ai_technical_analysis: Optional[str]
    ai_recommendations: Optional[str]
    threat_indicators: List[str]
    attack_techniques: List[str]
    threat_intel_results: Dict[str, Any]
    ocr_text: Optional[str]
    created_at: datetime
    title: Optional[str]

    class Config:
        from_attributes = True


# Report Schemas
class ReportResponse(BaseModel):
    id: int
    user_id: int
    analysis_id: int
    title: str
    file_size: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# Dashboard Stats
class DashboardStats(BaseModel):
    total_analyses: int
    total_reports: int
    critical_threats: int
    high_threats: int
    medium_threats: int
    safe_count: int
    scam_type_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    recent_analyses: List[AnalysisResponse]


class AdminStats(BaseModel):
    total_users: int
    total_analyses: int
    total_reports: int
    active_users_today: int
    critical_threats_today: int


# Threat Registry Schemas
class ThreatRegistryCreate(BaseModel):
    value: str = Field(..., min_length=2, max_length=500)
    type: str = Field(..., max_length=50)
    scam_type: str = Field(..., max_length=50)
    description: Optional[str] = None


class ThreatRegistryItemResponse(BaseModel):
    id: int
    value: str
    type: str
    scam_type: str
    risk_score: float
    risk_level: str
    description: Optional[str]
    reporter_username: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ThreatRegistryReportDetail(BaseModel):
    reporter: Optional[str]
    scam_type: str
    description: Optional[str]
    date: datetime


class ThreatRegistryCheckResponse(BaseModel):
    exists: bool
    value: str
    type: str
    risk_level: str
    risk_score: float
    scam_type: str
    total_reports: int
    reports: List[ThreatRegistryReportDetail]
    osint_analysis: Optional[Dict[str, Any]] = None

