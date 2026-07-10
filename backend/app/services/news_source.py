from __future__ import annotations

import html
import re
from datetime import date, datetime, timedelta
from email.utils import parsedate_to_datetime

import httpx

from app.config import settings

NAVER_NEWS_URL = "https://openapi.naver.com/v1/search/news.json"
FINNHUB_NEWS_URL = "https://finnhub.io/api/v1/company-news"

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    return html.unescape(_TAG_RE.sub("", text)).strip()


def fetch_kr_news(stock_name: str, limit: int) -> list[dict]:
    """Naver's news search API is a general keyword search, not a
    stock-specific feed, so results can include tangentially-related
    articles (the company name mentioned in passing). Biasing the query
    with '주가' trims some of that noise but doesn't eliminate it."""
    resp = httpx.get(
        NAVER_NEWS_URL,
        params={"query": f"{stock_name} 주가", "display": limit, "sort": "date"},
        headers={
            "X-Naver-Client-Id": settings.naver_client_id,
            "X-Naver-Client-Secret": settings.naver_client_secret,
        },
        timeout=10,
    )
    resp.raise_for_status()

    articles = []
    for item in resp.json().get("items", []):
        try:
            published_at = parsedate_to_datetime(item["pubDate"])
        except (KeyError, TypeError, ValueError):
            published_at = None
        articles.append(
            {
                "title": _strip_html(item["title"]),
                "url": item.get("originallink") or item["link"],
                "published_at": published_at,
            }
        )
    return articles


def fetch_us_news(ticker: str, limit: int, lookback_days: int = 14) -> list[dict]:
    resp = httpx.get(
        FINNHUB_NEWS_URL,
        params={
            "symbol": ticker,
            "from": (date.today() - timedelta(days=lookback_days)).isoformat(),
            "to": date.today().isoformat(),
            "token": settings.finnhub_api_key,
        },
        timeout=10,
    )
    resp.raise_for_status()

    articles = []
    for item in resp.json()[:limit]:
        articles.append(
            {
                "title": item["headline"],
                "url": item["url"],
                "published_at": datetime.fromtimestamp(item["datetime"]),
            }
        )
    return articles


def fetch_news(market: str, ticker: str, stock_name: str, limit: int) -> list[dict]:
    if market == "KR":
        return fetch_kr_news(stock_name, limit)
    return fetch_us_news(ticker, limit)
