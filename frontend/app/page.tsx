"use client";

import { Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import MarketToggle from "@/components/MarketToggle";
import { searchStocks } from "@/lib/api";
import type { Market, StockSearchResult } from "@/lib/types";

export default function Home() {
  const [market, setMarket] = useState<Market>("KR");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await searchStocks(keyword.trim(), market);
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // Center the hero while there's nothing below it; once results appear,
  // let the page grow from the top instead of centering the whole block.
  const centered = results.length === 0 && !searched;

  return (
    <div className={`page-container${centered ? " justify-center" : ""}`}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="bg-brand/10 text-brand inline-flex size-12 items-center justify-center rounded-2xl">
          <Sparkles className="size-6" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI Stock Coach</h1>
        <p className="text-muted text-sm">
          종목을 검색하면 정량 점수와 AI 리포트를 보여드려요.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col items-center gap-4">
        <MarketToggle value={market} onChange={setMarket} />
        <div className="relative w-full">
          <Search className="text-muted pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={market === "KR" ? "예: 삼성전자" : "예: Apple"}
            className="input-field"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {error && <p className="text-error text-center text-sm">{error}</p>}

      {searched && !loading && results.length === 0 && !error && (
        <p className="text-muted text-center text-sm">검색 결과가 없습니다.</p>
      )}

      <ul className="flex flex-col gap-1">
        {results.map((stock) => (
          <li key={`${stock.market}:${stock.ticker}`}>
            <Link href={`/stocks/${stock.market}/${stock.ticker}`} className="result-row">
              <div>
                <p className="font-medium">{stock.name}</p>
                <p className="text-muted text-xs">
                  {stock.ticker}
                  {stock.sector ? ` · ${stock.sector}` : ""}
                </p>
              </div>
              <span className="text-muted font-mono text-xs">{stock.market}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
