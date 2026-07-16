from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.models.news import News
from app.models.stock import Stock
from app.services import llm_service, news_source

logger = logging.getLogger(__name__)

DEFAULT_LIMIT = 10


def sync_news(db: Session, stock: Stock, limit: int = DEFAULT_LIMIT) -> int:
    """Fetch recent news, skip articles already stored, analyze the rest
    (summary + sentiment) and persist. Returns the number of new rows.

    Best-effort: a flaky news provider must not break analysis for the
    price/technical side, so fetch failures are logged and swallowed —
    News Score simply falls back to its neutral default (see score_engine).
    """
    try:
        articles = news_source.fetch_news(stock.market, stock.ticker, stock.name, limit)
    except Exception:
        logger.exception("News fetch failed for %s:%s", stock.market, stock.ticker)
        return 0
    if not articles:
        return 0

    existing_urls = {
        row.url
        for row in db.query(News.url).filter(News.stock_id == stock.id).all()
    }
    new_articles = [a for a in articles if a["url"] not in existing_urls]
    if not new_articles:
        return 0

    analysis = llm_service.analyze_news([a["title"] for a in new_articles]) or {}

    rows = []
    for i, article in enumerate(new_articles):
        info = analysis.get(i, {})
        rows.append(
            News(
                stock_id=stock.id,
                title=article["title"],
                url=article["url"],
                source=article.get("source"),
                published_at=article["published_at"],
                sentiment=info.get("sentiment"),
                sentiment_score=info.get("sentiment_score"),
                summary=info.get("summary"),
            )
        )
    db.add_all(rows)
    db.commit()
    return len(rows)
