from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database.connection import Base


class ScamType(str, enum.Enum):
    PHISHING = "Phishing"
    UPI_FRAUD = "UPI Fraud"
    JOB_SCAM = "Job Scam"
    LOTTERY_SCAM = "Lottery Scam"
    INVESTMENT_SCAM = "Investment Scam"
    ROMANCE_SCAM = "Romance Scam"
    CRYPTO_SCAM = "Crypto Scam"
    DELIVERY_SCAM = "Delivery Scam"
    TECH_SUPPORT_SCAM = "Tech Support Scam"
    GOVERNMENT_SCAM = "Government Scam"
    UNKNOWN = "Unknown"
    SAFE = "Safe"


class RiskLevel(str, enum.Enum):
    SAFE = "Safe"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class InputType(str, enum.Enum):
    SMS = "SMS"
    WHATSAPP = "WhatsApp"
    EMAIL = "Email"
    URL = "URL"
    IMAGE = "Image"
    TEXT = "Text"


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    input_type = Column(String(50), nullable=False)
    raw_input = Column(Text, nullable=True)
    extracted_text = Column(Text, nullable=True)
    extracted_urls = Column(JSON, default=list)
    extracted_emails = Column(JSON, default=list)
    extracted_phones = Column(JSON, default=list)
    extracted_upi_ids = Column(JSON, default=list)
    extracted_crypto_wallets = Column(JSON, default=list)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="Safe")
    scam_type = Column(String(50), default="Unknown")
    scam_confidence = Column(Float, default=0.0)
    ai_summary = Column(Text, nullable=True)
    ai_technical_analysis = Column(Text, nullable=True)
    ai_recommendations = Column(Text, nullable=True)
    threat_indicators = Column(JSON, default=list)
    attack_techniques = Column(JSON, default=list)
    threat_intel_results = Column(JSON, default=dict)
    ocr_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    title = Column(String(255), nullable=True)

    user = relationship("User", back_populates="analyses")
    reports = relationship("Report", back_populates="analysis", cascade="all, delete-orphan")
    uploaded_files = relationship("UploadedFile", back_populates="analysis")
    threat_logs = relationship("ThreatIntelligenceLog", back_populates="analysis", cascade="all, delete-orphan")
