import type {
  AnalysisOut,
  BacktestOut,
  HoldingOut,
  Market,
  NewsOut,
  StockDetail,
  StockSearchResult,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    // FastAPI error responses are {"detail": "..."} — fall back to raw text
    // for anything else (e.g. a proxy/network error page).
    const body = await res.text().catch(() => "");
    let detail = body;
    try {
      detail = JSON.parse(body).detail ?? body;
    } catch {
      // not JSON, use as-is
    }
    throw new ApiError(res.status, detail || res.statusText);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export function searchStocks(
  keyword: string,
  market: Market,
  limit = 20
): Promise<StockSearchResult[]> {
  const params = new URLSearchParams({ keyword, market, limit: String(limit) });
  return apiFetch(`/api/stocks/search?${params}`);
}

export function getStock(ticker: string, market: Market): Promise<StockDetail> {
  const params = new URLSearchParams({ market });
  return apiFetch(`/api/stocks/${ticker}?${params}`);
}

export function getAnalysis(
  ticker: string,
  market: Market,
  force = false
): Promise<AnalysisOut> {
  const params = new URLSearchParams({ market });
  return apiFetch(`/api/stocks/${ticker}/analysis?${params}`, {
    method: force ? "POST" : "GET",
  });
}

export function getNews(
  ticker: string,
  market: Market,
  limit = 10
): Promise<NewsOut[]> {
  const params = new URLSearchParams({ market, limit: String(limit) });
  return apiFetch(`/api/stocks/${ticker}/news?${params}`);
}

export function listHoldings(): Promise<HoldingOut[]> {
  return apiFetch("/api/holdings");
}

export function createHolding(input: {
  ticker: string;
  market: Market;
  quantity: number;
  avg_price: number;
}): Promise<HoldingOut> {
  return apiFetch("/api/holdings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateHolding(
  id: number,
  input: { quantity: number; avg_price: number }
): Promise<HoldingOut> {
  return apiFetch(`/api/holdings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteHolding(id: number): Promise<void> {
  await apiFetch(`/api/holdings/${id}`, { method: "DELETE" });
}

export function runBacktest(
  ticker: string,
  market: Market,
  startDate: string,
  endDate: string
): Promise<BacktestOut> {
  const params = new URLSearchParams({
    market,
    start_date: startDate,
    end_date: endDate,
  });
  return apiFetch(`/api/stocks/${ticker}/backtest?${params}`);
}
