from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel

Market = Literal["KR", "US"]


class StockSearchResult(BaseModel):
    ticker: str
    market: Market
    name: str
    sector: Optional[str] = None


class StockDetail(BaseModel):
    ticker: str
    market: Market
    name: str
    sector: Optional[str] = None

    class Config:
        from_attributes = True


class PriceHistoryOut(BaseModel):
    date: date
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[int] = None

    class Config:
        from_attributes = True
