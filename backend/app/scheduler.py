from __future__ import annotations

import logging
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import SessionLocal
from app.models.stock import Stock
from app.models.user import Holding, Watchlist
from app.services import stock_service

logger = logging.getLogger(__name__)

KST = ZoneInfo("Asia/Seoul")

_scheduler: BackgroundScheduler | None = None


def _tracked_stock_ids(db) -> set[int]:
    watchlist_ids = {row[0] for row in db.query(Watchlist.stock_id).distinct()}
    holding_ids = {row[0] for row in db.query(Holding.stock_id).distinct()}
    return watchlist_ids | holding_ids


def refresh_tracked_stocks() -> None:
    """Refresh price_history for every stock in watchlist or holdings.

    Runs once daily, scheduled after both the KR close (15:30 KST) and the
    US close (~06:00 KST) — see design doc 9장/11장 Phase 5. Everything
    else stays on-demand; this only pre-warms the stocks the user actually
    tracks, so opening watchlist/holdings the next morning doesn't each
    trigger their own live FinanceDataReader fetch.
    """
    db = SessionLocal()
    try:
        stock_ids = _tracked_stock_ids(db)
        if not stock_ids:
            logger.info("Daily price refresh: no watchlist/holdings stocks tracked")
            return

        stocks = db.query(Stock).filter(Stock.id.in_(stock_ids)).all()
        synced = 0
        for stock in stocks:
            try:
                stock_service.sync_price_history(db, stock)
                synced += 1
            except Exception:
                logger.exception(
                    "Daily price refresh failed for %s:%s", stock.market, stock.ticker
                )
        logger.info("Daily price refresh done: %d/%d stocks synced", synced, len(stocks))
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    global _scheduler
    _scheduler = BackgroundScheduler(timezone=KST)
    _scheduler.add_job(
        refresh_tracked_stocks,
        trigger=CronTrigger(hour=7, minute=0, timezone=KST),
        id="daily_price_refresh",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler started: daily_price_refresh at 07:00 Asia/Seoul")
    return _scheduler


def shutdown_scheduler() -> None:
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
