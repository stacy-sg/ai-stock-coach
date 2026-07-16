from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AnalysisOut(BaseModel):
    analyzed_at: datetime
    engine_version: str
    trend_score: float
    momentum_score: float
    risk_score: float
    volume_score: float
    news_score: float
    total_score: float
    signal: str
    llm_report: Optional[str] = None
    expires_at: Optional[datetime] = None
    close: Optional[float] = None
    change_pct: Optional[float] = None

    class Config:
        from_attributes = True
