from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from app.database.connection import Base


class ThreatRegistryItem(Base):
    __tablename__ = "threat_registry"

    id = Column(Integer, primary_key=True, index=True)
    value = Column(String(500), index=True, nullable=False)
    type = Column(String(50), nullable=False)  # "UPI ID", "Phone Number", "Bank Account", "Domain"
    scam_type = Column(String(50), nullable=False)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default="Safe")  # "Safe", "Medium", "High", "Critical"
    description = Column(Text, nullable=True)
    reporter_username = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
