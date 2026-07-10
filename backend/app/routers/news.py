from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.news import News
from app.schemas.news import NewsOut
from app.schemas.stock import Market
from app.services import news_service, stock_service

router = APIRouter(prefix="/api/stocks", tags=["news"])


@router.get("/{ticker}/news", response_model=list[NewsOut])
def get_news(
    ticker: str,
    market: Market,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    stock = stock_service.get_or_create_stock(db, ticker, market)
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    news_service.sync_news(db, stock, limit=limit)

    return (
        db.query(News)
        .filter(News.stock_id == stock.id)
        .order_by(News.published_at.desc())
        .limit(limit)
        .all()
    )
