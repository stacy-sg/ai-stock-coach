from datetime import datetime

from sqlalchemy import (
    DECIMAL,
    BigInteger,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True)
    ticker = Column(String, nullable=False)
    market = Column(String(2), nullable=False)  # KR / US
    name = Column(String, nullable=False)
    sector = Column(String)

    __table_args__ = (UniqueConstraint("ticker", "market", name="uq_ticker_market"),)

    price_history = relationship("PriceHistory", back_populates="stock")
    analysis_snapshots = relationship("AnalysisSnapshot", back_populates="stock")
    news = relationship("News", back_populates="stock")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    date = Column(Date, nullable=False)
    open = Column(DECIMAL)
    high = Column(DECIMAL)
    low = Column(DECIMAL)
    close = Column(DECIMAL)
    volume = Column(BigInteger)

    __table_args__ = (UniqueConstraint("stock_id", "date", name="uq_stock_date"),)

    stock = relationship("Stock", back_populates="price_history")


class AnalysisSnapshot(Base):
    __tablename__ = "analysis_snapshots"

    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    engine_version = Column(String, nullable=False, default="score_v1.0")
    trend_score = Column(DECIMAL)
    momentum_score = Column(DECIMAL)
    risk_score = Column(DECIMAL)
    volume_score = Column(DECIMAL)
    news_score = Column(DECIMAL)
    total_score = Column(DECIMAL)
    signal = Column(String(10))  # BUY / HOLD / WATCH / SELL
    llm_report = Column(String)
    expires_at = Column(DateTime)

    stock = relationship("Stock", back_populates="analysis_snapshots")
