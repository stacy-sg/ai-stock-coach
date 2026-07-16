from __future__ import annotations

import logging
from datetime import date

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.engine.score_engine import InsufficientHistoryError, calculate_scores
from app.models.stock import Stock
from app.models.user import User, Watchlist
from app.services import stock_service

logger = logging.getLogger(__name__)


class StockNotFoundError(Exception):
    pass


class DuplicateWatchlistError(Exception):
    pass


def _enrich(db: Session, item: Watchlist, stock: Stock) -> dict:
    base = {
        "id": item.id,
        "ticker": stock.ticker,
        "market": stock.market,
        "name": stock.name,
        "created_at": item.created_at,
        "close": None,
        "change_pct": None,
        "signal": None,
    }

    try:
        stock_service.sync_price_history(db, stock)
        result = calculate_scores(db, stock.ticker, stock.market, date.today())
    except InsufficientHistoryError:
        return base
    except Exception:
        logger.exception("Failed to score watchlist item %s:%s", stock.market, stock.ticker)
        return base

    close, prev_close = stock_service.get_latest_prices(db, stock)
    base["close"] = close
    base["change_pct"] = (
        (close - prev_close) / prev_close * 100 if close is not None and prev_close else None
    )
    base["signal"] = result.signal
    return base


def list_watchlist(db: Session, user: User) -> list[dict]:
    rows = (
        db.query(Watchlist, Stock)
        .join(Stock, Stock.id == Watchlist.stock_id)
        .filter(Watchlist.user_id == user.id)
        .order_by(Watchlist.created_at.desc())
        .all()
    )
    return [_enrich(db, item, stock) for item, stock in rows]


def add_watchlist(db: Session, user: User, ticker: str, market: str) -> dict:
    stock = stock_service.get_or_create_stock(db, ticker, market)
    if stock is None:
        raise StockNotFoundError(f"{market}:{ticker} not found")

    item = Watchlist(user_id=user.id, stock_id=stock.id)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateWatchlistError(f"watchlist entry for {market}:{ticker} already exists")
    db.refresh(item)
    return _enrich(db, item, stock)


def remove_watchlist(db: Session, user: User, item_id: int) -> bool:
    item = (
        db.query(Watchlist)
        .filter(Watchlist.id == item_id, Watchlist.user_id == user.id)
        .first()
    )
    if item is None:
        return False

    db.delete(item)
    db.commit()
    return True
