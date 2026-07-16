from __future__ import annotations

from datetime import date

import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator
from ta.volatility import AverageTrueRange


class InsufficientDataError(Exception):
    pass


def compute_indicators(df: pd.DataFrame, as_of_date: date) -> dict:
    """Compute technical indicators as of as_of_date (inclusive).

    df must be indexed by date (ascending) with open/high/low/close/volume columns.
    Only rows up to and including as_of_date are used, to avoid look-ahead bias.
    """
    history = df[df.index.date <= as_of_date]
    if history.empty:
        raise InsufficientDataError(f"no price data on or before {as_of_date}")

    close = history["close"]
    high = history["high"]
    low = history["low"]
    volume = history["volume"]

    ma5 = SMAIndicator(close, window=5).sma_indicator()
    ma20 = SMAIndicator(close, window=20).sma_indicator()
    ma60 = SMAIndicator(close, window=60).sma_indicator()
    rsi14 = RSIIndicator(close, window=14).rsi()
    macd_calc = MACD(close)
    atr14 = AverageTrueRange(high, low, close, window=14).average_true_range()
    volume_ma20 = SMAIndicator(volume, window=20).sma_indicator()

    def last(series: pd.Series) -> float | None:
        value = series.iloc[-1]
        return None if pd.isna(value) else float(value)

    prev_close = None if len(close) < 2 else float(close.iloc[-2])

    return {
        "as_of_date": history.index[-1].date(),
        "close": last(close),
        "prev_close": prev_close,
        "ma5": last(ma5),
        "ma20": last(ma20),
        "ma60": last(ma60),
        "rsi14": last(rsi14),
        "macd": last(macd_calc.macd()),
        "macd_signal": last(macd_calc.macd_signal()),
        "atr14": last(atr14),
        "volume": last(volume),
        "volume_ma20": last(volume_ma20),
    }
