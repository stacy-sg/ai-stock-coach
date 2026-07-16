from __future__ import annotations

import logging
from datetime import date
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.engine.score_engine import InsufficientHistoryError, calculate_scores
from app.models.stock import Stock
from app.models.user import Holding, User
from app.services import stock_service

logger = logging.getLogger(__name__)

CURRENCY_BY_MARKET = {"KR": "KRW", "US": "USD"}


class StockNotFoundError(Exception):
    pass


class DuplicateHoldingError(Exception):
    pass


PARTIAL_SELL_RETURN_THRESHOLD = 10.0  # %
RISK_WARNING_SCORE_THRESHOLD = 20.0


def _guide(return_pct: float, signal: str, risk_score: float) -> str:
    if signal == "SELL" or risk_score < RISK_WARNING_SCORE_THRESHOLD:
        return "리스크 경고"
    if return_pct >= PARTIAL_SELL_RETURN_THRESHOLD and signal in ("WATCH", "HOLD"):
        return "분할 익절"
    if signal == "BUY":
        return "보유"
    return "관망"


def _enrich(db: Session, holding: Holding, stock: Stock) -> dict:
    base = {
        "id": holding.id,
        "ticker": stock.ticker,
        "market": stock.market,
        "name": stock.name,
        "quantity": float(holding.quantity),
        "avg_price": float(holding.avg_price),
        "currency": holding.currency,
        "purchase_date": holding.purchase_date,
        "created_at": holding.created_at,
        "updated_at": holding.updated_at,
        "current_price": None,
        "return_pct": None,
        "signal": None,
        "risk_score": None,
        "guide": None,
        "note": None,
    }

    try:
        stock_service.sync_price_history(db, stock)
        result = calculate_scores(db, stock.ticker, stock.market, date.today())
    except InsufficientHistoryError:
        base["note"] = "가격 이력이 부족해 아직 가이드를 계산할 수 없습니다."
        return base
    except Exception:
        logger.exception("Failed to score holding %s:%s", stock.market, stock.ticker)
        base["note"] = "일시적으로 가이드를 계산하지 못했습니다."
        return base

    current_price = result.indicators["close"]
    avg_price = float(holding.avg_price)
    return_pct = (current_price - avg_price) / avg_price * 100

    base["current_price"] = current_price
    base["return_pct"] = return_pct
    base["signal"] = result.signal
    base["risk_score"] = result.risk_score
    base["guide"] = _guide(return_pct, result.signal, result.risk_score)
    return base


def list_holdings(db: Session, user: User) -> list[dict]:
    rows = (
        db.query(Holding, Stock)
        .join(Stock, Stock.id == Holding.stock_id)
        .filter(Holding.user_id == user.id)
        .all()
    )
    return [_enrich(db, holding, stock) for holding, stock in rows]


def create_holding(
    db: Session,
    user: User,
    ticker: str,
    market: str,
    quantity: float,
    avg_price: float,
    purchase_date: Optional[date],
) -> dict:
    stock = stock_service.get_or_create_stock(db, ticker, market)
    if stock is None:
        raise StockNotFoundError(f"{market}:{ticker} not found")

    holding = Holding(
        user_id=user.id,
        stock_id=stock.id,
        quantity=quantity,
        avg_price=avg_price,
        currency=CURRENCY_BY_MARKET[market],
        purchase_date=purchase_date or date.today(),
    )
    db.add(holding)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateHoldingError(f"holding for {market}:{ticker} already exists")
    db.refresh(holding)
    return _enrich(db, holding, stock)


def update_holding(
    db: Session, user: User, holding_id: int, quantity: float, avg_price: float
) -> Optional[dict]:
    holding = (
        db.query(Holding)
        .filter(Holding.id == holding_id, Holding.user_id == user.id)
        .first()
    )
    if holding is None:
        return None

    holding.quantity = quantity
    holding.avg_price = avg_price
    db.commit()
    db.refresh(holding)

    stock = db.query(Stock).filter(Stock.id == holding.stock_id).first()
    return _enrich(db, holding, stock)


def delete_holding(db: Session, user: User, holding_id: int) -> bool:
    holding = (
        db.query(Holding)
        .filter(Holding.id == holding_id, Holding.user_id == user.id)
        .first()
    )
    if holding is None:
        return False

    db.delete(holding)
    db.commit()
    return True
