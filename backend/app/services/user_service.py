from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.user import User

DEFAULT_NICKNAME = "default"


def get_default_user(db: Session) -> User:
    """SINGLE_USER mode: no auth, everything belongs to one fixed user row."""
    user = db.query(User).filter(User.nickname == DEFAULT_NICKNAME).first()
    if user:
        return user

    user = User(nickname=DEFAULT_NICKNAME)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
