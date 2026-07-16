from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.stock import Market


class HoldingCreate(BaseModel):
    ticker: str
    market: Market
    quantity: float = Field(gt=0)
    avg_price: float = Field(gt=0)
    purchase_date: Optional[date] = None


class HoldingUpdate(BaseModel):
    quantity: float = Field(gt=0)
    avg_price: float = Field(gt=0)


class HoldingOut(BaseModel):
    id: int
    ticker: str
    market: Market
    name: str
    quantity: float
    avg_price: float
    currency: str
    purchase_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    current_price: Optional[float] = None
    return_pct: Optional[float] = None
    signal: Optional[str] = None
    risk_score: Optional[float] = None
    guide: Optional[str] = None
    note: Optional[str] = None
