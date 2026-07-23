from __future__ import annotations

import pandas as pd
import pytest


def _fake_price_df(n: int = 90) -> pd.DataFrame:
    # calculate_scores filters to [today - 400d, today], so the fake series
    # must end at "today" regardless of when the test suite happens to run.
    idx = pd.date_range(end=pd.Timestamp.today().normalize(), periods=n, freq="D")
    close = [100 + i * 0.3 for i in range(n)]
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


@pytest.fixture(autouse=True)
def _mock_external_services(monkeypatch):
    from app.services import market_data, news_source

    monkeypatch.setattr(
        market_data,
        "lookup_listing",
        lambda ticker, market: {"ticker": ticker, "name": f"테스트{ticker}", "sector": None},
    )
    monkeypatch.setattr(
        market_data, "fetch_price_history", lambda ticker, start, end=None: _fake_price_df()
    )
    monkeypatch.setattr(news_source, "fetch_news", lambda market, ticker, name, limit: [])


class TestAnalysisApi:
    def test_returns_score_and_llm_report(self, client, monkeypatch):
        from app.services import llm_service

        monkeypatch.setattr(llm_service, "generate_report", lambda *a, **k: "테스트 리포트")

        res = client.get("/api/stocks/ANLZ1/analysis?market=KR")

        assert res.status_code == 200
        body = res.json()
        assert body["signal"] in ("BUY", "HOLD", "WATCH", "SELL")
        assert body["llm_report"] == "테스트 리포트"

    def test_second_call_is_served_from_cache_not_a_fresh_llm_call(self, client, monkeypatch):
        """Design doc §5/§12.1: LLM is only called on a cache miss. If this
        regresses, every page view of the same stock would re-bill Gemini."""
        from app.services import llm_service

        calls = {"count": 0}

        def fake_generate_report(*args, **kwargs):
            calls["count"] += 1
            return f"리포트 {calls['count']}"

        monkeypatch.setattr(llm_service, "generate_report", fake_generate_report)

        first = client.get("/api/stocks/ANLZ2/analysis?market=KR")
        second = client.get("/api/stocks/ANLZ2/analysis?market=KR")

        assert first.status_code == second.status_code == 200
        assert calls["count"] == 1
        assert first.json()["llm_report"] == second.json()["llm_report"] == "리포트 1"

    def test_force_reanalysis_bypasses_cache(self, client, monkeypatch):
        from app.services import llm_service

        calls = {"count": 0}

        def fake_generate_report(*args, **kwargs):
            calls["count"] += 1
            return f"리포트 {calls['count']}"

        monkeypatch.setattr(llm_service, "generate_report", fake_generate_report)

        client.get("/api/stocks/ANLZ3/analysis?market=KR")
        forced = client.post("/api/stocks/ANLZ3/analysis?market=KR")

        assert forced.status_code == 200
        assert calls["count"] == 2
        assert forced.json()["llm_report"] == "리포트 2"

    def test_unknown_ticker_returns_404(self, client, monkeypatch):
        from app.services import market_data

        monkeypatch.setattr(market_data, "lookup_listing", lambda ticker, market: None)

        res = client.get("/api/stocks/NOPE/analysis?market=KR")
        assert res.status_code == 404
