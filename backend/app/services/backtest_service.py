from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from sqlalchemy.orm import Session

from app.engine.backtest import BacktestResult, run_backtest
from app.services import llm_service


@dataclass
class BacktestWithComment:
    result: BacktestResult
    ai_comment: str | None


def run_backtest_with_comment(
    db: Session, stock_name: str, ticker: str, market: str, start_date: date, end_date: date
) -> BacktestWithComment:
    result = run_backtest(db, ticker, market, start_date, end_date)
    ai_comment = llm_service.generate_backtest_summary(stock_name, market, result)
    return BacktestWithComment(result=result, ai_comment=ai_comment)
