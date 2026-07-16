from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

import pandas as pd
from sqlalchemy.orm import Session
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator
from ta.volatility import AverageTrueRange

from app.engine.score_engine import (
    WEIGHTS,
    StockNotFoundError,
    _momentum_score,
    _risk_score,
    _signal,
    _trend_score,
    _volume_score,
)
from app.models.news import News
from app.models.stock import PriceHistory, Stock

INDICATOR_WARMUP_DAYS = 400
SURGE_LOOKBACK_DAYS = 5
SURGE_THRESHOLD = 0.15


class InsufficientBacktestDataError(Exception):
    pass


@dataclass
class Trade:
    entry_date: date
    entry_price: float
    exit_date: date
    exit_price: float
    return_pct: float


@dataclass
class EquityPoint:
    date: date
    equity: float


@dataclass
class BacktestResult:
    ticker: str
    market: str
    start_date: date
    end_date: date
    trades: list[Trade]
    equity_curve: list[EquityPoint]
    buy_hold_curve: list[EquityPoint]
    total_return_pct: float
    buy_hold_return_pct: float
    win_rate: float
    max_drawdown_pct: float
    num_trades: int
    days_evaluated: int


def _load_price_df(db: Session, stock_id: int, start: date, end: date) -> pd.DataFrame:
    rows = (
        db.query(PriceHistory)
        .filter(
            PriceHistory.stock_id == stock_id,
            PriceHistory.date >= start,
            PriceHistory.date <= end,
        )
        .order_by(PriceHistory.date)
        .all()
    )
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
    if df.empty:
        return df
    df["date"] = pd.to_datetime(df["date"])
    return df.set_index("date").astype(float)


def _compute_indicator_series(df: pd.DataFrame) -> pd.DataFrame:
    """Vectorized indicators over the whole series at once. Recomputing a
    truncated rolling window per backtest day (like the live analysis path
    does) would be O(n^2) over a backtest range, so this computes every
    indicator's full time series in one pass instead."""
    out = df.copy()
    out["ma5"] = SMAIndicator(df["close"], window=5).sma_indicator()
    out["ma20"] = SMAIndicator(df["close"], window=20).sma_indicator()
    out["ma60"] = SMAIndicator(df["close"], window=60).sma_indicator()
    out["rsi14"] = RSIIndicator(df["close"], window=14).rsi()
    macd_calc = MACD(df["close"])
    out["macd"] = macd_calc.macd()
    out["macd_signal"] = macd_calc.macd_signal()
    out["atr14"] = AverageTrueRange(
        df["high"], df["low"], df["close"], window=14
    ).average_true_range()
    out["volume_ma20"] = SMAIndicator(df["volume"], window=20).sma_indicator()
    # NaN comparisons are False in pandas, so the not-enough-history warmup
    # rows correctly come out as "no surge" rather than needing a guard.
    out["surge"] = df["close"].pct_change(periods=SURGE_LOOKBACK_DAYS) >= SURGE_THRESHOLD
    return out


def _news_score_series(
    db: Session, stock_id: int, trading_days: list[date]
) -> dict[date, float]:
    """Cumulative-average news score as of each trading day, in one pass
    (two-pointer merge) instead of one DB query per day."""
    rows = (
        db.query(News.published_at, News.sentiment_score)
        .filter(News.stock_id == stock_id, News.sentiment_score.isnot(None))
        .order_by(News.published_at)
        .all()
    )
    news_events = [(r[0].date(), float(r[1])) for r in rows]

    scores: dict[date, float] = {}
    idx = 0
    running_sum = 0.0
    running_count = 0
    for day in trading_days:
        while idx < len(news_events) and news_events[idx][0] <= day:
            running_sum += news_events[idx][1]
            running_count += 1
            idx += 1
        scores[day] = 50.0 if running_count == 0 else (running_sum / running_count + 1) / 2 * 100
    return scores


def run_backtest(
    db: Session, ticker: str, market: str, start_date: date, end_date: date
) -> BacktestResult:
    """Replays the score_v1.0 rule engine day-by-day and simulates a
    long-only, signal-following strategy: enter full position on BUY, exit
    fully on SELL, hold through HOLD/WATCH. Reuses the same scoring
    functions as the live analysis path so backtest results and live
    signals never drift apart.
    """
    stock = (
        db.query(Stock).filter(Stock.ticker == ticker, Stock.market == market).first()
    )
    if stock is None:
        raise StockNotFoundError(f"{market}:{ticker} not found")

    warmup_start = start_date - timedelta(days=INDICATOR_WARMUP_DAYS)
    df = _load_price_df(db, stock.id, warmup_start, end_date)
    if df.empty:
        raise InsufficientBacktestDataError(f"no price history for {market}:{ticker}")

    ind_df = _compute_indicator_series(df)
    window = ind_df[(ind_df.index.date >= start_date) & (ind_df.index.date <= end_date)]
    if window.empty:
        raise InsufficientBacktestDataError(
            f"no price history for {market}:{ticker} between {start_date} and {end_date}"
        )

    trading_days = [ts.date() for ts in window.index]
    news_scores = _news_score_series(db, stock.id, trading_days)

    trades: list[Trade] = []
    equity_curve: list[EquityPoint] = []
    in_position = False
    entry_price = 0.0
    entry_date: date | None = None
    equity = 1.0
    peak = 1.0
    max_drawdown = 0.0

    for ts, row in window.iterrows():
        day = ts.date()
        close = row["close"]

        required = (
            row["ma5"], row["ma20"], row["ma60"], row["rsi14"],
            row["macd"], row["macd_signal"], row["atr14"], row["volume_ma20"],
        )
        if not any(pd.isna(v) for v in required):
            trend = _trend_score(close, row["ma5"], row["ma20"], row["ma60"])
            momentum = _momentum_score(row["rsi14"], row["macd"], row["macd_signal"])
            risk = _risk_score(row["atr14"], close, bool(row["surge"]))
            volume = _volume_score(row["volume"], row["volume_ma20"])
            news = news_scores.get(day, 50.0)
            total = (
                risk * WEIGHTS["risk"]
                + trend * WEIGHTS["trend"]
                + volume * WEIGHTS["volume"]
                + momentum * WEIGHTS["momentum"]
                + news * WEIGHTS["news"]
            )
            signal = _signal(total)

            if not in_position and signal == "BUY":
                in_position, entry_price, entry_date = True, close, day
            elif in_position and signal == "SELL":
                trade_return = (close - entry_price) / entry_price
                trades.append(Trade(entry_date, entry_price, day, close, trade_return * 100))
                equity *= 1 + trade_return
                in_position, entry_price, entry_date = False, 0.0, None

        current_equity = equity * (close / entry_price) if in_position else equity
        peak = max(peak, current_equity)
        max_drawdown = min(max_drawdown, (current_equity - peak) / peak)
        equity_curve.append(EquityPoint(day, current_equity))

    if in_position:
        last_close = window["close"].iloc[-1]
        trade_return = (last_close - entry_price) / entry_price
        trades.append(
            Trade(entry_date, entry_price, window.index[-1].date(), last_close, trade_return * 100)
        )
        equity *= 1 + trade_return

    first_close = window["close"].iloc[0]
    last_close = window["close"].iloc[-1]
    win_rate = (
        sum(1 for t in trades if t.return_pct > 0) / len(trades) * 100 if trades else 0.0
    )
    buy_hold_curve = [
        EquityPoint(ts.date(), close / first_close) for ts, close in window["close"].items()
    ]

    return BacktestResult(
        ticker=ticker,
        market=market,
        start_date=start_date,
        end_date=end_date,
        trades=trades,
        equity_curve=equity_curve,
        buy_hold_curve=buy_hold_curve,
        total_return_pct=(equity - 1) * 100,
        buy_hold_return_pct=(last_close - first_close) / first_close * 100,
        win_rate=win_rate,
        max_drawdown_pct=max_drawdown * 100,
        num_trades=len(trades),
        days_evaluated=len(trading_days),
    )
