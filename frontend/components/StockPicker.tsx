"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import MarketToggle from "@/components/MarketToggle";
import { searchStocks } from "@/lib/api";
import type { Market, StockSearchResult } from "@/lib/types";

export default function StockPicker({
  onSelect,
}: {
  onSelect: (stock: StockSearchResult) => void;
}) {
  const [market, setMarket] = useState<Market>("KR");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      setResults(await searchStocks(keyword.trim(), market, 8));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <MarketToggle value={market} onChange={setMarket} />

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={market === "KR" ? "예: 삼성전자" : "예: Apple"}
            className="input-field"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {results.length > 0 && (
        <ul className="border-border-subtle flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border dark:divide-zinc-800">
          {results.map((stock) => (
            <li key={`${stock.market}:${stock.ticker}`}>
              <button
                type="button"
                onClick={() => onSelect(stock)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <div>
                  <p className="text-sm font-medium">{stock.name}</p>
                  <p className="text-muted text-xs">
                    {stock.ticker}
                    {stock.sector ? ` · ${stock.sector}` : ""}
                  </p>
                </div>
                <span className="text-muted font-mono text-xs">{stock.market}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
