from __future__ import annotations

from datetime import date, timedelta

import pandas as pd
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.stock import PriceHistory, Stock
from app.services import market_data

PRICE_HISTORY_LOOKBACK_DAYS = 400


def search_stocks(keyword: str, market: str, limit: int) -> list[dict]:
    results = market_data.search_listing(keyword, market, limit)
    return [{**r, "market": market} for r in results]


def get_or_create_stock(db: Session, ticker: str, market: str) -> Stock | None:
    stock = (
        db.query(Stock)
        .filter(Stock.ticker == ticker, Stock.market == market)
        .first()
    )
    if stock:
        return stock

    info = market_data.lookup_listing(ticker, market)
    if info is None:
        return None

    stock = Stock(
        ticker=info["ticker"],
        market=market,
        name=info["name"],
        sector=info["sector"],
    )
    db.add(stock)
    db.commit()
    db.refresh(stock)
    return stock


def sync_price_history(db: Session, stock: Stock, as_of_date: date | None = None) -> int:
    """Fetch missing price history from FinanceDataReader and upsert it.

    Returns the number of rows written (inserted or refreshed).
    """
    as_of_date = as_of_date or date.today()

    latest = (
        db.query(PriceHistory.date)
        .filter(PriceHistory.stock_id == stock.id)
        .order_by(PriceHistory.date.desc())
        .first()
    )
    start = (
        latest[0] - timedelta(days=5)
        if latest
        else as_of_date - timedelta(days=PRICE_HISTORY_LOOKBACK_DAYS)
    )
    if start > as_of_date:
        return 0

    df = market_data.fetch_price_history(stock.ticker, start, as_of_date)
    if df.empty:
        return 0

    def to_float(value) -> float | None:
        return None if pd.isna(value) else float(value)

    def to_int(value) -> int | None:
        return None if pd.isna(value) else int(value)

    rows = [
        {
            "stock_id": stock.id,
            "date": idx.date(),
            "open": to_float(row.open),
            "high": to_float(row.high),
            "low": to_float(row.low),
            "close": to_float(row.close),
            "volume": to_int(row.volume),
        }
        for idx, row in df.iterrows()
    ]

    stmt = insert(PriceHistory).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["stock_id", "date"],
        set_={
            "open": stmt.excluded.open,
            "high": stmt.excluded.high,
            "low": stmt.excluded.low,
            "close": stmt.excluded.close,
            "volume": stmt.excluded.volume,
        },
    )
    db.execute(stmt)
    db.commit()
    return len(rows)
