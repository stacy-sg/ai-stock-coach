import type {
  AnalysisOut,
  BacktestOut,
  HoldingOut,
  Market,
  NewsOut,
  PopularStockOut,
  StockDetail,
  StockSearchResult,
  WatchlistOut,
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

// FastAPI's own request-validation errors (bad query param, wrong type,
// missing field — raised before our route code even runs) use a totally
// different `detail` shape than our HTTPException(..., detail="string")
// calls: a list of {type, loc, msg, input, ctx} objects, one per invalid
// field. Flatten that into readable text instead of passing the raw
// object/array through — ApiError.detail must always end up a string, or
// rendering it directly (e.g. <StatusMessage description={err.detail} />)
// crashes with "Objects are not valid as a React child".
function normalizeDetail(raw: unknown, fallback: string): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((item) =>
        item && typeof item === "object" && "msg" in item ? String(item.msg) : JSON.stringify(item)
      )
      .join(" / ");
  }
  if (raw && typeof raw === "object") return JSON.stringify(raw);
  return fallback;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    // FastAPI error responses are {"detail": ...} — fall back to raw text
    // for anything else (e.g. a proxy/network error page).
    const body = await res.text().catch(() => "");
    let raw: unknown = body;
    try {
      raw = JSON.parse(body).detail;
    } catch {
      // not JSON, use the raw text as-is
    }
    throw new ApiError(res.status, normalizeDetail(raw, res.statusText));
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

export function getPopularStocks(market: Market, limit = 4): Promise<PopularStockOut[]> {
  const params = new URLSearchParams({ market, limit: String(limit) });
  return apiFetch(`/api/stocks/popular?${params}`);
}

export function listWatchlist(): Promise<WatchlistOut[]> {
  return apiFetch("/api/watchlist");
}

export function addWatchlist(ticker: string, market: Market): Promise<WatchlistOut> {
  return apiFetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, market }),
  });
}

export async function removeWatchlist(id: number): Promise<void> {
  await apiFetch(`/api/watchlist/${id}`, { method: "DELETE" });
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
