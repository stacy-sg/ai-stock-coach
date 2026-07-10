from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    title = Column(String, nullable=False)
    url = Column(String)
    published_at = Column(DateTime)
    sentiment = Column(String(10))  # POSITIVE / NEGATIVE / NEUTRAL
    sentiment_score = Column(Numeric)  # -1.0 ~ 1.0
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("stock_id", "url", name="uq_news_stock_url"),)

    stock = relationship("Stock", back_populates="news")
