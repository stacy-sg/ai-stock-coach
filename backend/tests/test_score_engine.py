from __future__ import annotations

import math
from datetime import date, datetime, timedelta

import pytest

from app.engine.score_engine import (
    InsufficientHistoryError,
    StockNotFoundError,
    _momentum_score,
    _news_score,
    _risk_score,
    _signal,
    _trend_score,
    _volume_score,
    calculate_scores,
)
from app.models.news import News
from app.models.stock import PriceHistory, Stock


# ---------------------------------------------------------------------------
# Pure scoring functions — one case per row of design doc §6.2's tables.
# ---------------------------------------------------------------------------


class TestTrendScore:
    def test_full_bullish_alignment(self):
        assert _trend_score(close=110, ma5=105, ma20=100, ma60=95) == 100

    def test_ma5_above_ma20_but_ma60_inverted(self):
        assert _trend_score(close=101, ma5=102, ma20=100, ma60=105) == 70

    def test_above_ma20_but_ma5_below_ma20(self):
        assert _trend_score(close=101, ma5=98, ma20=100, ma60=90) == 50

    def test_full_bearish_alignment(self):
        assert _trend_score(close=85, ma5=90, ma20=95, ma60=100) == 10

    def test_below_ma20_default_case(self):
        assert _trend_score(close=90, ma5=95, ma20=95, ma60=94) == 20


class TestMomentumScore:
    def test_healthy_zone_with_bullish_macd_scales_from_90(self):
        # Scales 90->100 across rsi14 in [50, 65) — at exactly 65 it falls
        # into the separate "approaching overbought" branch below (70), so
        # 100 is a limit this formula approaches but never actually hits.
        assert _momentum_score(rsi14=50, macd=1, macd_signal=0.5) == 90
        assert _momentum_score(rsi14=60, macd=1, macd_signal=0.5) == pytest.approx(90 + 10 / 15 * 10)

    def test_healthy_zone_with_bearish_macd(self):
        assert _momentum_score(rsi14=55, macd=0.3, macd_signal=0.5) == 60

    def test_approaching_overbought(self):
        assert _momentum_score(rsi14=67, macd=0, macd_signal=0) == 70

    def test_overbought(self):
        assert _momentum_score(rsi14=75, macd=0, macd_signal=0) == 30

    def test_neutral_low(self):
        assert _momentum_score(rsi14=45, macd=0, macd_signal=0) == 40

    def test_weak(self):
        assert _momentum_score(rsi14=35, macd=0, macd_signal=0) == 25

    def test_oversold(self):
        assert _momentum_score(rsi14=20, macd=0, macd_signal=0) == 10


class TestRiskScore:
    def test_under_1_percent_volatility(self):
        assert _risk_score(atr14=0.5, close=100, surged=False) == pytest.approx(95)

    def test_1_to_2_percent(self):
        assert _risk_score(atr14=1.5, close=100, surged=False) == pytest.approx(79.5)

    def test_2_to_4_percent(self):
        assert _risk_score(atr14=3, close=100, surged=False) == pytest.approx(54.5)

    def test_4_to_6_percent(self):
        assert _risk_score(atr14=5, close=100, surged=False) == pytest.approx(29.5)

    def test_over_6_percent(self):
        assert _risk_score(atr14=8, close=100, surged=False) == pytest.approx(13)

    def test_surge_penalty_applied(self):
        base = _risk_score(atr14=0.5, close=100, surged=False)
        surged = _risk_score(atr14=0.5, close=100, surged=True)
        assert surged == pytest.approx(base - 20)

    def test_clamped_to_zero_floor(self):
        assert _risk_score(atr14=50, close=100, surged=True) == 0


class TestVolumeScore:
    def test_double_average_or_more(self):
        assert _volume_score(volume=250, volume_ma20=100) == 100

    def test_boundary_at_2x_falls_into_lower_bucket(self):
        assert _volume_score(volume=200, volume_ma20=100) == 80

    def test_1point5x_to_2x(self):
        assert _volume_score(volume=180, volume_ma20=100) == 80

    def test_1x_to_1point5x(self):
        assert _volume_score(volume=120, volume_ma20=100) == 60

    def test_0point7x_to_1x(self):
        assert _volume_score(volume=80, volume_ma20=100) == 40

    def test_below_0point7x(self):
        assert _volume_score(volume=50, volume_ma20=100) == 20


class TestSignal:
    @pytest.mark.parametrize(
        "total_score,expected",
        [
            (100, "BUY"),
            (70, "BUY"),
            (69.9, "HOLD"),
            (50, "HOLD"),
            (49.9, "WATCH"),
            (30, "WATCH"),
            (29.9, "SELL"),
            (0, "SELL"),
        ],
    )
    def test_thresholds(self, total_score, expected):
        assert _signal(total_score) == expected


# ---------------------------------------------------------------------------
# _news_score — regression coverage for the as_of_date/published_at boundary
# bug (same-day news was being silently excluded; see design doc changelog).
# ---------------------------------------------------------------------------


class TestNewsScore:
    def test_defaults_to_neutral_when_no_news(self, db_session):
        stock = Stock(ticker="NEWS1", market="KR", name="뉴스없음")
        db_session.add(stock)
        db_session.commit()

        assert _news_score(db_session, stock.id, date(2025, 1, 1)) == 50.0

    def test_averages_sentiment_linearly(self, db_session):
        stock = Stock(ticker="NEWS2", market="KR", name="뉴스평균")
        db_session.add(stock)
        db_session.commit()
        db_session.add_all(
            [
                News(stock_id=stock.id, title="a", sentiment_score=0.5, published_at=datetime(2025, 1, 1, 9, 0)),
                News(stock_id=stock.id, title="b", sentiment_score=-0.5, published_at=datetime(2025, 1, 1, 15, 0)),
            ]
        )
        db_session.commit()

        # avg sentiment 0.0 -> (0 + 1) / 2 * 100 = 50
        assert _news_score(db_session, stock.id, date(2025, 1, 1)) == pytest.approx(50.0)

    def test_same_day_news_counts_future_news_does_not(self, db_session):
        stock = Stock(ticker="NEWS3", market="KR", name="당일뉴스")
        db_session.add(stock)
        db_session.commit()
        db_session.add_all(
            [
                News(
                    stock_id=stock.id,
                    title="same-day evening",
                    sentiment_score=1.0,
                    published_at=datetime(2025, 1, 5, 23, 0),
                ),
                News(
                    stock_id=stock.id,
                    title="next-day",
                    sentiment_score=-1.0,
                    published_at=datetime(2025, 1, 6, 0, 1),
                ),
            ]
        )
        db_session.commit()

        score = _news_score(db_session, stock.id, date(2025, 1, 5))

        # Only the same-day article should count -> (1 + 1) / 2 * 100 = 100.
        # If the boundary bug regressed, same-day news would be excluded and
        # this would fall back to the neutral default (50).
        assert score == pytest.approx(100.0)


# ---------------------------------------------------------------------------
# calculate_scores — end-to-end wiring, look-ahead bias, error paths.
# ---------------------------------------------------------------------------


def _seed_price_history(db, stock: Stock, n: int, start_date: date) -> None:
    for i in range(n):
        # Deterministic drift + wiggle so RSI/MACD see real up/down movement
        # instead of degenerating to a flat or monotonic series.
        price = 100 + i * 0.3 + math.sin(i / 3) * 2
        db.add(
            PriceHistory(
                stock_id=stock.id,
                date=start_date + timedelta(days=i),
                open=price,
                high=price + 1,
                low=price - 1,
                close=price,
                volume=1_000_000 + (i % 5) * 50_000,
            )
        )
    db.commit()


class TestCalculateScores:
    def test_stock_not_found_raises(self, db_session):
        with pytest.raises(StockNotFoundError):
            calculate_scores(db_session, "NOPE", "KR", date.today())

    def test_insufficient_history_raises(self, db_session):
        stock = Stock(ticker="SHORT", market="KR", name="쇼트")
        db_session.add(stock)
        db_session.commit()
        _seed_price_history(db_session, stock, n=10, start_date=date(2025, 1, 1))

        with pytest.raises(InsufficientHistoryError):
            calculate_scores(db_session, "SHORT", "KR", date(2025, 1, 10))

    def test_result_shape(self, db_session):
        stock = Stock(ticker="SHAPE", market="KR", name="쉐입")
        db_session.add(stock)
        db_session.commit()
        start = date(2025, 1, 1)
        _seed_price_history(db_session, stock, n=120, start_date=start)

        result = calculate_scores(db_session, "SHAPE", "KR", start + timedelta(days=100))

        assert result.signal in ("BUY", "HOLD", "WATCH", "SELL")
        assert 0 <= result.total_score <= 100
        assert result.engine_version == "score_v1.0"

    def test_does_not_leak_future_prices(self, db_session):
        """Core §12.2 guarantee: calculate_scores(as_of_date=T) must be
        unaffected by any price data after T, so the exact same function can
        be reused for backtesting without look-ahead bias."""
        stock = Stock(ticker="NOLEAK", market="KR", name="리크없음")
        db_session.add(stock)
        db_session.commit()
        start = date(2025, 1, 1)
        _seed_price_history(db_session, stock, n=120, start_date=start)

        as_of = start + timedelta(days=70)
        before = calculate_scores(db_session, "NOLEAK", "KR", as_of)

        future_row = (
            db_session.query(PriceHistory)
            .filter(
                PriceHistory.stock_id == stock.id,
                PriceHistory.date == start + timedelta(days=110),
            )
            .one()
        )
        future_row.close = 999_999
        future_row.high = 999_999
        db_session.commit()

        after = calculate_scores(db_session, "NOLEAK", "KR", as_of)

        assert after.total_score == pytest.approx(before.total_score)
        assert after.indicators["close"] == pytest.approx(before.indicators["close"])
        assert after.signal == before.signal
