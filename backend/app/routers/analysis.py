from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.engine.score_engine import InsufficientHistoryError
from app.schemas.analysis import AnalysisOut
from app.schemas.stock import Market
from app.services import analysis_service, stock_service

router = APIRouter(prefix="/api/stocks", tags=["analysis"])


@router.get("/{ticker}/analysis", response_model=AnalysisOut)
def get_analysis(ticker: str, market: Market, db: Session = Depends(get_db)):
    return _run_analysis(ticker, market, db, force=False)


@router.post("/{ticker}/analysis", response_model=AnalysisOut)
def force_analysis(ticker: str, market: Market, db: Session = Depends(get_db)):
    return _run_analysis(ticker, market, db, force=True)


def _run_analysis(ticker: str, market: str, db: Session, force: bool) -> AnalysisOut:
    stock = stock_service.get_or_create_stock(db, ticker, market)
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    try:
        return analysis_service.analyze(db, stock, force=force)
    except InsufficientHistoryError as e:
        raise HTTPException(status_code=422, detail=str(e))
