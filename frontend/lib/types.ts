export type Market = "KR" | "US";

export type Signal = "BUY" | "HOLD" | "WATCH" | "SELL";

export interface StockSearchResult {
  ticker: string;
  market: Market;
  name: string;
  sector: string | null;
}

export interface StockDetail {
  ticker: string;
  market: Market;
  name: string;
  sector: string | null;
}

export interface AnalysisOut {
  analyzed_at: string;
  engine_version: string;
  trend_score: number;
  momentum_score: number;
  risk_score: number;
  volume_score: number;
  news_score: number;
  total_score: number;
  signal: Signal;
  llm_report: string | null;
  expires_at: string | null;
  close: number | null;
  change_pct: number | null;
}

export interface NewsOut {
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  sentiment: string | null;
  sentiment_score: number | null;
  summary: string | null;
}

export type HoldingGuide = "보유" | "분할 익절" | "관망" | "리스크 경고";

export interface HoldingOut {
  id: number;
  ticker: string;
  market: Market;
  name: string;
  quantity: number;
  avg_price: number;
  currency: string;
  purchase_date: string | null;
  created_at: string;
  updated_at: string;
  current_price: number | null;
  return_pct: number | null;
  signal: Signal | null;
  risk_score: number | null;
  guide: HoldingGuide | null;
  note: string | null;
}

export interface TradeOut {
  entry_date: string;
  entry_price: number;
  exit_date: string;
  exit_price: number;
  return_pct: number;
}

export interface EquityPointOut {
  date: string;
  equity: number;
}

export interface PopularStockOut {
  ticker: string;
  market: Market;
  name: string;
  change_pct: number | null;
}

export interface WatchlistOut {
  id: number;
  ticker: string;
  market: Market;
  name: string;
  created_at: string;
  close: number | null;
  change_pct: number | null;
  signal: Signal | null;
}

export interface BacktestOut {
  ticker: string;
  market: Market;
  start_date: string;
  end_date: string;
  trades: TradeOut[];
  equity_curve: EquityPointOut[];
  buy_hold_curve: EquityPointOut[];
  total_return_pct: number;
  buy_hold_return_pct: number;
  win_rate: number;
  max_drawdown_pct: number;
  num_trades: number;
  days_evaluated: number;
}
