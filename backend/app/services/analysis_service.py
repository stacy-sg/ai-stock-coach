from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.engine import cache_policy
from app.engine.score_engine import ENGINE_VERSION, calculate_scores
from app.models.stock import AnalysisSnapshot, Stock
from app.services import llm_service, news_service, stock_service


def _cached_snapshot(db: Session, stock: Stock, now: datetime) -> AnalysisSnapshot | None:
    snapshot = (
        db.query(AnalysisSnapshot)
        .filter(
            AnalysisSnapshot.stock_id == stock.id,
            AnalysisSnapshot.engine_version == ENGINE_VERSION,
        )
        .order_by(AnalysisSnapshot.analyzed_at.desc())
        .first()
    )
    if snapshot and snapshot.expires_at and snapshot.expires_at > now:
        return snapshot
    return None


def analyze(db: Session, stock: Stock, force: bool = False) -> AnalysisSnapshot:
    # AnalysisSnapshot.analyzed_at/expires_at are naive `timestamp without time
    # zone` columns, so we store/compare naive KST wall-clock values throughout
    # rather than mixing them with tz-aware datetimes.
    now_kst = datetime.now(cache_policy.KST)
    now = now_kst.replace(tzinfo=None)

    if not force:
        cached = _cached_snapshot(db, stock, now)
        if cached:
            return cached

    stock_service.sync_price_history(db, stock)
    news_service.sync_news(db, stock)

    result = calculate_scores(db, stock.ticker, stock.market, now.date())
    expires_at = cache_policy.compute_expires_at(stock.market, now_kst).replace(tzinfo=None)

    # LLM 호출은 캐시 미스일 때만 발생 (설계서 5장 AI 파이프라인 원칙)
    llm_report = llm_service.generate_report(stock.name, stock.market, result.indicators, result)

    snapshot = AnalysisSnapshot(
        stock_id=stock.id,
        analyzed_at=now,
        engine_version=result.engine_version,
        trend_score=result.trend_score,
        momentum_score=result.momentum_score,
        risk_score=result.risk_score,
        volume_score=result.volume_score,
        news_score=result.news_score,
        total_score=result.total_score,
        signal=result.signal,
        llm_report=llm_report,
        expires_at=expires_at,
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot
