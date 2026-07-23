from __future__ import annotations

import math
from datetime import date, timedelta

import pytest

from app.engine.backtest import (
    InsufficientBacktestDataError,
    _compute_indicator_series,
    _load_price_df,
    run_backtest,
)
from app.engine.score_engine import StockNotFoundError, calculate_scores
from app.models.stock import PriceHistory, Stock

INDICATOR_KEYS = ("ma5", "ma20", "ma60", "rsi14", "macd", "macd_signal", "atr14", "volume_ma20")


def _seed_uptrend(db, stock: Stock, n: int, start_date: date) -> None:
    """Gentle uptrend with wiggle — same shape used in score_engine tests.
    Reliable enough history for BUY signals to appear without ever forcing
    a SELL (see test_backtest exploration: this shape never crosses back
    below the SELL threshold, so it's used for entry-signal + warmup tests,
    not for exercising the SELL/liquidation path)."""
    for i in range(n):
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


def _seed_peak_then_decline(db, stock: Stock, n: int, start_date: date, peak_at: int) -> None:
    """Rises to a peak then declines for the rest of the series — used to
    exercise a position that's still open when the backtest window ends."""
    for i in range(n):
        price = 100 + i * 0.8 if i < peak_at else 100 + peak_at * 0.8 - (i - peak_at) * 0.8
        db.add(
            PriceHistory(
                stock_id=stock.id,
                date=start_date + timedelta(days=i),
                open=price,
                high=price + 1,
                low=price - 1,
                close=price,
                volume=1_000_000,
            )
        )
    db.commit()


class TestRunBacktestErrors:
    def test_stock_not_found_raises(self, db_session):
        with pytest.raises(StockNotFoundError):
            run_backtest(db_session, "NOPE", "KR", date(2024, 1, 1), date(2024, 6, 1))

    def test_no_price_history_raises(self, db_session):
        stock = Stock(ticker="EMPTY", market="KR", name="없음")
        db_session.add(stock)
        db_session.commit()

        with pytest.raises(InsufficientBacktestDataError):
            run_backtest(db_session, "EMPTY", "KR", date(2024, 1, 1), date(2024, 6, 1))


class TestVectorizedIndicatorsMatchLivePath:
    """The whole reason backtest.py exists as a separate engine is
    performance (vectorized over the whole range instead of recomputing a
    truncated window per day like the live path) — see design doc §6.5.
    That's only safe if the two paths actually agree at every cutoff date.
    This is the automated version of the "manual cross-check" the design
    doc says was done by hand.
    """

    def test_indicators_match_at_multiple_cutoff_dates(self, db_session):
        stock = Stock(ticker="MATCH", market="KR", name="일치검증")
        db_session.add(stock)
        db_session.commit()
        start = date(2024, 1, 1)
        n = 300
        _seed_uptrend(db_session, stock, n=n, start_date=start)

        warmup_start = start - timedelta(days=400)
        df = _load_price_df(db_session, stock.id, warmup_start, start + timedelta(days=n))
        ind_df = _compute_indicator_series(df)

        for offset in (100, 150, 200, 250, n - 1):
            as_of = start + timedelta(days=offset)
            live = calculate_scores(db_session, "MATCH", "KR", as_of)
            row = ind_df.loc[ind_df.index.date == as_of].iloc[0]

            for key in INDICATOR_KEYS:
                assert row[key] == pytest.approx(live.indicators[key]), (
                    f"{key} diverged at {as_of}: vectorized={row[key]} live={live.indicators[key]}"
                )


class TestStrategyExecution:
    def test_entry_is_only_taken_on_a_live_buy_signal(self, db_session):
        stock = Stock(ticker="ENTRY", market="KR", name="진입검증")
        db_session.add(stock)
        db_session.commit()
        start = date(2024, 1, 1)
        _seed_uptrend(db_session, stock, n=300, start_date=start)

        result = run_backtest(
            db_session, "ENTRY", "KR", start + timedelta(days=100), start + timedelta(days=250)
        )

        assert len(result.trades) >= 1
        for trade in result.trades:
            live = calculate_scores(db_session, "ENTRY", "KR", trade.entry_date)
            assert live.signal == "BUY"

    def test_position_still_open_at_window_end_is_force_liquidated(self, db_session):
        """Design doc §6.5: "백테스트 종료일까지 포지션이 남아있으면 마지막
        날 종가로 강제 청산해 수익률에 반영" — a steady decline that never
        crosses back up to a BUY re-entry but also never trips SELL (smooth,
        low-volatility decline keeps the risk sub-score high enough to hold
        total_score above the SELL floor) reliably leaves a position open."""
        stock = Stock(ticker="FORCED", market="KR", name="강제청산")
        db_session.add(stock)
        db_session.commit()
        start = date(2024, 1, 1)
        _seed_peak_then_decline(db_session, stock, n=400, start_date=start, peak_at=200)

        end_date = start + timedelta(days=390)
        result = run_backtest(db_session, "FORCED", "KR", start + timedelta(days=100), end_date)

        assert len(result.trades) == 1
        assert result.trades[0].exit_date == end_date
        assert result.num_trades == 1

    def test_buy_hold_return_matches_first_to_last_close(self, db_session):
        stock = Stock(ticker="HODL", market="KR", name="바이앤홀드")
        db_session.add(stock)
        db_session.commit()
        start = date(2024, 1, 1)
        _seed_uptrend(db_session, stock, n=300, start_date=start)

        bt_start, bt_end = start + timedelta(days=100), start + timedelta(days=250)
        result = run_backtest(db_session, "HODL", "KR", bt_start, bt_end)

        assert result.buy_hold_curve[0].equity == pytest.approx(1.0)
        assert result.buy_hold_curve[-1].equity == pytest.approx(1 + result.buy_hold_return_pct / 100)

    def test_win_rate_matches_trade_outcomes(self, db_session):
        stock = Stock(ticker="WINRATE", market="KR", name="승률검증")
        db_session.add(stock)
        db_session.commit()
        start = date(2024, 1, 1)
        _seed_uptrend(db_session, stock, n=300, start_date=start)

        result = run_backtest(
            db_session, "WINRATE", "KR", start + timedelta(days=100), start + timedelta(days=250)
        )

        expected = (
            sum(1 for t in result.trades if t.return_pct > 0) / len(result.trades) * 100
            if result.trades
            else 0.0
        )
        assert result.win_rate == pytest.approx(expected)

    def test_max_drawdown_is_never_positive(self, db_session):
        stock = Stock(ticker="MDD", market="KR", name="낙폭검증")
        db_session.add(stock)
        db_session.commit()
        start = date(2024, 1, 1)
        _seed_peak_then_decline(db_session, stock, n=400, start_date=start, peak_at=200)

        result = run_backtest(
            db_session, "MDD", "KR", start + timedelta(days=100), start + timedelta(days=390)
        )

        assert result.max_drawdown_pct <= 0
