from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.holding import HoldingCreate, HoldingOut, HoldingUpdate
from app.services import holding_service, user_service

router = APIRouter(prefix="/api/holdings", tags=["holdings"])


@router.get("", response_model=list[HoldingOut])
def list_holdings(db: Session = Depends(get_db)):
    user = user_service.get_default_user(db)
    return holding_service.list_holdings(db, user)


@router.post("", response_model=HoldingOut, status_code=201)
def create_holding(body: HoldingCreate, db: Session = Depends(get_db)):
    user = user_service.get_default_user(db)
    try:
        return holding_service.create_holding(
            db,
            user,
            body.ticker,
            body.market,
            body.quantity,
            body.avg_price,
            body.purchase_date,
        )
    except holding_service.StockNotFoundError:
        raise HTTPException(status_code=404, detail="Stock not found")
    except holding_service.DuplicateHoldingError:
        raise HTTPException(status_code=409, detail="Holding for this stock already exists")


@router.put("/{holding_id}", response_model=HoldingOut)
def update_holding(holding_id: int, body: HoldingUpdate, db: Session = Depends(get_db)):
    user = user_service.get_default_user(db)
    result = holding_service.update_holding(
        db, user, holding_id, body.quantity, body.avg_price
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    return result


@router.delete("/{holding_id}", status_code=204)
def delete_holding(holding_id: int, db: Session = Depends(get_db)):
    user = user_service.get_default_user(db)
    if not holding_service.delete_holding(db, user, holding_id):
        raise HTTPException(status_code=404, detail="Holding not found")
