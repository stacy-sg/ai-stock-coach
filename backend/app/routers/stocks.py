from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.stock import Market, PopularStockOut, StockDetail, StockSearchResult
from app.services import stock_service

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/search", response_model=list[StockSearchResult])
def search_stocks(
    keyword: str = Query(..., min_length=1),
    market: Market = Query(...),
    limit: int = Query(20, ge=1, le=100),
):
    return stock_service.search_stocks(keyword, market, limit)


@router.get("/popular", response_model=list[PopularStockOut])
def get_popular_stocks(
    market: Market = Query(...),
    limit: int = Query(4, ge=1, le=20),
    db: Session = Depends(get_db),
):
    stocks = stock_service.get_popular_stocks(db, market, limit)
    results = []
    for stock in stocks:
        close, prev_close = stock_service.get_latest_prices(db, stock)
        change_pct = (
            (close - prev_close) / prev_close * 100 if close is not None and prev_close else None
        )
        results.append(
            {
                "ticker": stock.ticker,
                "market": stock.market,
                "name": stock.name,
                "change_pct": change_pct,
            }
        )
    return results


@router.get("/{ticker}", response_model=StockDetail)
def get_stock(ticker: str, market: Market, db: Session = Depends(get_db)):
    stock = stock_service.get_or_create_stock(db, ticker, market)
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    stock_service.sync_price_history(db, stock)
    stock_service.record_view(db, stock)
    return stock
