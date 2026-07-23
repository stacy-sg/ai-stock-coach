from __future__ import annotations

import pandas as pd
import pytest


def _fake_price_df(n: int = 90) -> pd.DataFrame:
    # calculate_scores filters to [today - 400d, today] when _enrich scores
    # this stock, so the fake series must end at "today".
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
    """Every watchlist write path ends up in stock_service.get_or_create_stock
    (-> market_data.lookup_listing) and sync_price_history (->
    market_data.fetch_price_history) and, via _enrich's calculate_scores,
    doesn't touch news — but list/add also skip straight to scoring, so no
    news mock is even needed here (unlike the analysis endpoint tests)."""
    from app.services import market_data

    monkeypatch.setattr(
        market_data,
        "lookup_listing",
        lambda ticker, market: {"ticker": ticker, "name": f"테스트{ticker}", "sector": None},
    )
    monkeypatch.setattr(
        market_data, "fetch_price_history", lambda ticker, start, end=None: _fake_price_df()
    )


class TestWatchlistApi:
    def test_add_list_remove_round_trip(self, client):
        add_res = client.post("/api/watchlist", json={"ticker": "TEST1", "market": "KR"})
        assert add_res.status_code == 201
        item = add_res.json()
        assert item["ticker"] == "TEST1"
        assert item["market"] == "KR"
        assert item["name"] == "테스트TEST1"

        list_res = client.get("/api/watchlist")
        assert list_res.status_code == 200
        assert any(i["id"] == item["id"] for i in list_res.json())

        delete_res = client.delete(f"/api/watchlist/{item['id']}")
        assert delete_res.status_code == 204

        list_after = client.get("/api/watchlist")
        assert all(i["id"] != item["id"] for i in list_after.json())

    def test_duplicate_add_returns_409(self, client):
        first = client.post("/api/watchlist", json={"ticker": "DUP1", "market": "KR"})
        assert first.status_code == 201

        duplicate = client.post("/api/watchlist", json={"ticker": "DUP1", "market": "KR"})
        assert duplicate.status_code == 409

    def test_remove_nonexistent_returns_404(self, client):
        res = client.delete("/api/watchlist/999999")
        assert res.status_code == 404

    def test_add_unknown_ticker_returns_404(self, client, monkeypatch):
        from app.services import market_data

        monkeypatch.setattr(market_data, "lookup_listing", lambda ticker, market: None)

        res = client.post("/api/watchlist", json={"ticker": "NOPE", "market": "KR"})
        assert res.status_code == 404
