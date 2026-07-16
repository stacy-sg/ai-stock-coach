from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.engine.backtest import InsufficientBacktestDataError, run_backtest
from app.engine.score_engine import StockNotFoundError
from app.schemas.backtest import BacktestOut
from app.schemas.stock import Market
from app.services import stock_service

router = APIRouter(prefix="/api/stocks", tags=["backtest"])


@router.get("/{ticker}/backtest", response_model=BacktestOut)
def backtest(
    ticker: str,
    market: Market,
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
):
    if start_date >= end_date:
        raise HTTPException(status_code=422, detail="start_date must be before end_date")

    stock = stock_service.get_or_create_stock(db, ticker, market)
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    stock_service.sync_price_history(db, stock)

    try:
        return run_backtest(db, ticker, market, start_date, end_date)
    except StockNotFoundError:
        raise HTTPException(status_code=404, detail="Stock not found")
    except InsufficientBacktestDataError as e:
        raise HTTPException(status_code=422, detail=str(e))
