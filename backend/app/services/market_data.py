from __future__ import annotations

import threading
from datetime import date, datetime, timedelta

import FinanceDataReader as fdr
import pandas as pd

LISTING_TTL = timedelta(hours=24)
US_EXCHANGES = ("NASDAQ", "NYSE", "AMEX")

_listing_cache: dict[str, tuple[pd.DataFrame, datetime]] = {}
_listing_lock = threading.Lock()


def get_kr_listing_raw() -> pd.DataFrame:
    """Cached full-column KRX listing (Volume, ChagesRatio, etc. included).

    Search only needs ticker/name/sector, but trending needs the rest, so
    this is fetched and cached once and both views are derived from it —
    avoids hitting the KRX endpoint twice for the same data.
    """
    with _listing_lock:
        cached = _listing_cache.get("KR_RAW")
        if cached and datetime.utcnow() - cached[1] < LISTING_TTL:
            return cached[0]

    df = fdr.StockListing("KRX")

    with _listing_lock:
        _listing_cache["KR_RAW"] = (df, datetime.utcnow())
    return df


def _fetch_kr_listing() -> pd.DataFrame:
    df = get_kr_listing_raw()[["Code", "Name"]].copy()
    df["ticker"] = df["Code"]
    df["sector"] = None
    return df[["ticker", "Name", "sector"]].rename(columns={"Name": "name"})


def get_kr_trending(limit: int) -> list[dict]:
    """Real "most actively traded today" KR stocks, by trading volume —
    not a popularity metric derived from our own users (there's only one)."""
    df = get_kr_listing_raw()
    top = df.sort_values("Volume", ascending=False).head(limit)
    return [
        {
            "ticker": row.Code,
            "name": row.Name,
            "change_pct": None if pd.isna(row.ChagesRatio) else float(row.ChagesRatio),
        }
        for row in top.itertuples()
    ]


def _fetch_us_listing() -> pd.DataFrame:
    frames = []
    for exchange in US_EXCHANGES:
        part = fdr.StockListing(exchange)[["Symbol", "Name", "Industry"]].copy()
        frames.append(part)
    df = pd.concat(frames, ignore_index=True).drop_duplicates(subset="Symbol")
    df["ticker"] = df["Symbol"]
    return df[["ticker", "Name", "Industry"]].rename(
        columns={"Name": "name", "Industry": "sector"}
    )


def get_listing(market: str) -> pd.DataFrame:
    """Cached ticker/name/sector listing for KR or US market."""
    with _listing_lock:
        cached = _listing_cache.get(market)
        if cached and datetime.utcnow() - cached[1] < LISTING_TTL:
            return cached[0]

    df = _fetch_kr_listing() if market == "KR" else _fetch_us_listing()

    with _listing_lock:
        _listing_cache[market] = (df, datetime.utcnow())
    return df


def search_listing(keyword: str, market: str, limit: int) -> list[dict]:
    df = get_listing(market)
    mask = df["name"].str.contains(keyword, case=False, na=False) | df[
        "ticker"
    ].str.contains(keyword, case=False, na=False)
    matches = df[mask].head(limit)
    return [
        {"ticker": row.ticker, "name": row.name, "sector": row.sector or None}
        for row in matches.itertuples()
    ]


def lookup_listing(ticker: str, market: str) -> dict | None:
    df = get_listing(market)
    row = df[df["ticker"] == ticker]
    if row.empty:
        return None
    first = row.iloc[0]
    return {
        "ticker": first["ticker"],
        "name": first["name"],
        "sector": first["sector"] or None,
    }


def fetch_price_history(ticker: str, start: date, end: date | None = None) -> pd.DataFrame:
    """Standardized OHLCV history indexed by date, ascending."""
    df = fdr.DataReader(ticker, start, end)
    df = df.rename(columns=str.lower)
    return df[["open", "high", "low", "close", "volume"]]
