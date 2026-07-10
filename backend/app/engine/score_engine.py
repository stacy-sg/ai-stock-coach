from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

import pandas as pd
from sqlalchemy.orm import Session

from app.engine.indicators import compute_indicators
from app.models.news import News
from app.models.stock import PriceHistory, Stock

ENGINE_VERSION = "score_v1.0"

WEIGHTS = {
    "risk": 0.30,
    "trend": 0.25,
    "volume": 0.20,
    "momentum": 0.15,
    "news": 0.10,
}

SURGE_LOOKBACK_DAYS = 5
SURGE_THRESHOLD = 0.15
SURGE_PENALTY = 20


class StockNotFoundError(Exception):
    pass


class InsufficientHistoryError(Exception):
    pass


@dataclass
class ScoreResult:
    as_of_date: date
    trend_score: float
    momentum_score: float
    risk_score: float
    volume_score: float
    news_score: float
    total_score: float
    signal: str
    indicators: dict
    engine_version: str = ENGINE_VERSION


def _trend_score(close: float, ma5: float, ma20: float, ma60: float) -> float:
    if close > ma5 > ma20 > ma60:
        return 100
    if ma5 > ma20:
        return 70
    if close > ma20:
        return 50
    if ma5 < ma20 < ma60:
        return 10
    return 20


def _momentum_score(rsi14: float, macd: float, macd_signal: float) -> float:
    if rsi14 >= 70:
        return 30
    if rsi14 >= 65:
        return 70
    if rsi14 >= 50:
        if macd > macd_signal:
            return 90 + (rsi14 - 50) / 15 * 10
        return 60
    if rsi14 >= 40:
        return 40
    if rsi14 >= 30:
        return 25
    return 10


def _risk_score(atr14: float, close: float, surged: bool) -> float:
    ratio_pct = atr14 / close * 100

    if ratio_pct < 1:
        score = 100 - ratio_pct * 10
    elif ratio_pct < 2:
        score = 89 - (ratio_pct - 1) * 19
    elif ratio_pct < 4:
        score = 69 - (ratio_pct - 2) / 2 * 29
    elif ratio_pct < 6:
        score = 39 - (ratio_pct - 4) / 2 * 19
    else:
        score = max(10, 19 - (ratio_pct - 6) * 3)

    if surged:
        score -= SURGE_PENALTY
    return max(0, min(100, score))


def _volume_score(volume: float, volume_ma20: float) -> float:
    ratio = volume / volume_ma20
    if ratio > 2.0:
        return 100
    if ratio >= 1.5:
        return 80
    if ratio >= 1.0:
        return 60
    if ratio >= 0.7:
        return 40
    return 20


def _news_score(db: Session, stock_id: int, as_of_date: date) -> float:
    # as_of_date is a plain date; published_at is a timestamp, so compare
    # against the exclusive start of the *next* day or same-day news (which
    # always has a nonzero time-of-day) gets silently excluded.
    cutoff = as_of_date + timedelta(days=1)
    rows = (
        db.query(News.sentiment_score)
        .filter(
            News.stock_id == stock_id,
            News.sentiment_score.isnot(None),
            News.published_at < cutoff,
        )
        .all()
    )
    if not rows:
        return 50.0
    avg = sum(float(r[0]) for r in rows) / len(rows)
    return (avg + 1) / 2 * 100


def _detect_surge(price_df: pd.DataFrame, as_of_date: date) -> bool:
    history = price_df[price_df.index.date <= as_of_date]
    if len(history) <= SURGE_LOOKBACK_DAYS:
        return False
    recent = history.tail(SURGE_LOOKBACK_DAYS + 1)["close"]
    change = (recent.iloc[-1] - recent.iloc[0]) / recent.iloc[0]
    return change >= SURGE_THRESHOLD


def _signal(total_score: float) -> str:
    if total_score >= 70:
        return "BUY"
    if total_score >= 50:
        return "HOLD"
    if total_score >= 30:
        return "WATCH"
    return "SELL"


def calculate_scores(db: Session, ticker: str, market: str, as_of_date: date) -> ScoreResult:
    """Pure w.r.t. external calls: only reads DB state as of as_of_date, never
    fetches new data. Same (ticker, market, as_of_date) + same DB history
    always yields the same result, so this is safe to reuse for backtesting.
    """
    stock = (
        db.query(Stock)
        .filter(Stock.ticker == ticker, Stock.market == market)
        .first()
    )
    if stock is None:
        raise StockNotFoundError(f"{market}:{ticker} not found")

    start = as_of_date - timedelta(days=400)
    rows = (
        db.query(PriceHistory)
        .filter(
            PriceHistory.stock_id == stock.id,
            PriceHistory.date >= start,
            PriceHistory.date <= as_of_date,
        )
        .order_by(PriceHistory.date)
        .all()
    )
    if not rows:
        raise InsufficientHistoryError(f"no price history for {market}:{ticker}")

    df = pd.DataFrame(
        [
            {
                "date": r.date,
                "open": r.open,
                "high": r.high,
                "low": r.low,
                "close": r.close,
                "volume": r.volume,
            }
            for r in rows
        ]
    )
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").astype(float)

    ind = compute_indicators(df, as_of_date)
    missing = [
        k
        for k in ("ma5", "ma20", "ma60", "rsi14", "macd", "macd_signal", "atr14", "volume_ma20")
        if ind[k] is None
    ]
    if missing:
        raise InsufficientHistoryError(
            f"not enough price history for {market}:{ticker} to compute {missing}"
        )

    surged = _detect_surge(df, as_of_date)

    trend = _trend_score(ind["close"], ind["ma5"], ind["ma20"], ind["ma60"])
    momentum = _momentum_score(ind["rsi14"], ind["macd"], ind["macd_signal"])
    risk = _risk_score(ind["atr14"], ind["close"], surged)
    volume = _volume_score(ind["volume"], ind["volume_ma20"])
    news = _news_score(db, stock.id, as_of_date)

    total = (
        risk * WEIGHTS["risk"]
        + trend * WEIGHTS["trend"]
        + volume * WEIGHTS["volume"]
        + momentum * WEIGHTS["momentum"]
        + news * WEIGHTS["news"]
    )

    return ScoreResult(
        as_of_date=ind["as_of_date"],
        trend_score=trend,
        momentum_score=momentum,
        risk_score=risk,
        volume_score=volume,
        news_score=news,
        total_score=total,
        signal=_signal(total),
        indicators=ind,
    )
