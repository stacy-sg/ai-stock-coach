from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.watchlist import WatchlistCreate, WatchlistOut
from app.services import user_service, watchlist_service

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("", response_model=list[WatchlistOut])
def list_watchlist(db: Session = Depends(get_db)):
    user = user_service.get_default_user(db)
    return watchlist_service.list_watchlist(db, user)


@router.post("", response_model=WatchlistOut, status_code=201)
def add_watchlist(body: WatchlistCreate, db: Session = Depends(get_db)):
    user = user_service.get_default_user(db)
    try:
        return watchlist_service.add_watchlist(db, user, body.ticker, body.market)
    except watchlist_service.StockNotFoundError:
        raise HTTPException(status_code=404, detail="Stock not found")
    except watchlist_service.DuplicateWatchlistError:
        raise HTTPException(status_code=409, detail="Already in watchlist")


@router.delete("/{item_id}", status_code=204)
def remove_watchlist(item_id: int, db: Session = Depends(get_db)):
    user = user_service.get_default_user(db)
    if not watchlist_service.remove_watchlist(db, user, item_id):
        raise HTTPException(status_code=404, detail="Watchlist item not found")
