from __future__ import annotations

from datetime import date

import pandas as pd
import pytest

from app.engine.indicators import InsufficientDataError, compute_indicators


def _price_df(n: int, start: str = "2025-01-01") -> pd.DataFrame:
    idx = pd.date_range(start, periods=n, freq="D")
    close = [100 + i * 0.5 for i in range(n)]
    return pd.DataFrame(
        {
            "open": close,
            "high": [c + 1 for c in close],
            "low": [c - 1 for c in close],
            "close": close,
            "volume": [1_000_000] * n,
        },
        index=idx,
    )


def test_uses_only_rows_on_or_before_as_of_date():
    df = _price_df(100)
    as_of = df.index[50].date()

    ind = compute_indicators(df, as_of)

    assert ind["as_of_date"] == as_of
    assert ind["close"] == pytest.approx(df["close"].iloc[50])


def test_prev_close_is_the_prior_trading_day():
    df = _price_df(70)
    as_of = df.index[60].date()

    ind = compute_indicators(df, as_of)

    assert ind["prev_close"] == pytest.approx(df["close"].iloc[59])


def test_long_window_indicators_are_none_with_too_little_history():
    df = _price_df(10)

    ind = compute_indicators(df, df.index[-1].date())

    assert ind["close"] is not None
    assert ind["ma60"] is None  # needs 60 rows, only 10 available


def test_raises_when_no_data_on_or_before_as_of_date():
    df = _price_df(10)

    with pytest.raises(InsufficientDataError):
        compute_indicators(df, date(2000, 1, 1))
