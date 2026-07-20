from datetime import date
from typing import Optional

from pydantic import BaseModel


class TradeOut(BaseModel):
    entry_date: date
    entry_price: float
    exit_date: date
    exit_price: float
    return_pct: float


class EquityPointOut(BaseModel):
    date: date
    equity: float


class BacktestOut(BaseModel):
    ticker: str
    market: str
    name: str
    start_date: date
    end_date: date
    trades: list[TradeOut]
    equity_curve: list[EquityPointOut]
    buy_hold_curve: list[EquityPointOut]
    total_return_pct: float
    buy_hold_return_pct: float
    cagr_pct: float
    win_rate: float
    max_drawdown_pct: float
    num_trades: int
    days_evaluated: int
    ai_comment: Optional[str] = None
