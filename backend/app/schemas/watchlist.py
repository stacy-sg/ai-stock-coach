from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.stock import Market


class WatchlistCreate(BaseModel):
    ticker: str
    market: Market


class WatchlistOut(BaseModel):
    id: int
    ticker: str
    market: Market
    name: str
    created_at: datetime
    close: Optional[float] = None
    change_pct: Optional[float] = None
    signal: Optional[str] = None
