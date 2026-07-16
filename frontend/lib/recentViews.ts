import type { Market } from "./types";

export interface RecentView {
  ticker: string;
  market: Market;
  name: string;
}

const STORAGE_KEY = "ai-stock-coach:recent-views";
const MAX_ITEMS = 6;

export function getRecentViews(): RecentView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentView[]) : [];
  } catch {
    return [];
  }
}

export function recordRecentView(view: RecentView): void {
  if (typeof window === "undefined") return;
  const existing = getRecentViews().filter(
    (v) => !(v.ticker === view.ticker && v.market === view.market)
  );
  const next = [view, ...existing].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
