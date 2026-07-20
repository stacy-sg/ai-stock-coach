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


# Not a real "trending" source for US (FinanceDataReader's NASDAQ/NYSE/AMEX
# listings carry no price/volume columns to rank by — see market_data.py),
# so this is a fixed set of large, high-interest tickers rather than a
# usage-derived ranking. Revisit if a better US market-wide data source
# shows up.
US_POPULAR_TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL", "TSLA"]


def get_popular_stocks(db: Session, market: str, limit: int) -> list[dict]:
    if market == "KR":
        return market_data.get_kr_trending(limit)

    results = []
    for ticker in US_POPULAR_TICKERS[:limit]:
        stock = get_or_create_stock(db, ticker, market)
        if stock is None:
            continue
        sync_price_history(db, stock)
        close, prev_close = get_latest_prices(db, stock)
        change_pct = (
            (close - prev_close) / prev_close * 100 if close is not None and prev_close else None
        )
        results.append({"ticker": stock.ticker, "name": stock.name, "change_pct": change_pct})
    return results


def get_latest_prices(db: Session, stock: Stock) -> tuple[float | None, float | None]:
    """Latest close and the trading day before it, for a quote/change display.

    Independent of the analysis cache — a UI showing "current price" wants
    the freshest quote regardless of when the AI analysis snapshot was last
    computed.
    """
    rows = (
        db.query(PriceHistory.close)
        .filter(PriceHistory.stock_id == stock.id)
        .order_by(PriceHistory.date.desc())
        .limit(2)
        .all()
    )
    closes = [float(r[0]) for r in rows]
    close = closes[0] if len(closes) >= 1 else None
    prev_close = closes[1] if len(closes) >= 2 else None
    return close, prev_close
