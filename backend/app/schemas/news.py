from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NewsOut(BaseModel):
    title: str
    url: Optional[str] = None
    source: Optional[str] = None
    published_at: Optional[datetime] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    summary: Optional[str] = None

    class Config:
        from_attributes = True
