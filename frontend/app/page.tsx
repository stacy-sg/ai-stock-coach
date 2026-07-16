"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import PopularGrid from "@/components/PopularGrid";
import RecentSearchChips from "@/components/RecentSearchChips";
import WatchlistSection from "@/components/WatchlistSection";
import { getPopularStocks, listWatchlist, removeWatchlist, searchStocks } from "@/lib/api";
import { getRecentViews, type RecentView } from "@/lib/recentViews";
import type { PopularStockOut, StockSearchResult, WatchlistOut } from "@/lib/types";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<StockSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistOut[]>([]);
  const [popular, setPopular] = useState<PopularStockOut[]>([]);

  useEffect(() => {
    function loadRecentViews() {
      setRecentViews(getRecentViews());
    }

    loadRecentViews();
    listWatchlist()
      .then(setWatchlist)
      .catch(() => {});
    Promise.all([getPopularStocks("KR", 2), getPopularStocks("US", 2)])
      .then(([kr, us]) => setPopular([...kr, ...us]))
      .catch(() => {});
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) {
      setResults(null);
      return;
    }

    setSearching(true);
    setSearchError(null);
    try {
      // No market toggle here — search both markets and merge, so the user
      // never has to know or pick which one a ticker belongs to.
      const [kr, us] = await Promise.all([searchStocks(q, "KR"), searchStocks(q, "US")]);
      setResults([...kr, ...us]);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  }

  async function handleRemoveWatchlist(id: number) {
    setWatchlist((prev) => prev.filter((i) => i.id !== id));
    try {
      await removeWatchlist(id);
    } catch {
      listWatchlist()
        .then(setWatchlist)
        .catch(() => {});
    }
  }

  const showingResults = results !== null;

  return (
    <div className="page-container">
      {!showingResults && (
        <div className="flex flex-col gap-1 px-1">
          <span className="text-[15px] font-medium text-zinc-500 dark:text-zinc-400">
            안녕하세요 👋
          </span>
          <span className="text-[22px] font-bold tracking-tight">
            오늘은 어떤 종목이 궁금하세요?
          </span>
        </div>
      )}

      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              if (e.target.value.trim() === "") setResults(null);
            }}
            placeholder="종목명 또는 티커로 검색 (예: 삼성전자, AAPL)"
            className="input-field"
          />
        </div>
      </form>

      {showingResults ? (
        <div className="flex flex-col gap-3">
          {searching && <p className="text-muted py-8 text-center text-sm">검색 중...</p>}
          {searchError && <p className="text-error text-center text-sm">{searchError}</p>}
          {!searching && !searchError && results.length === 0 && (
            <p className="text-muted py-8 text-center text-sm">검색 결과가 없습니다.</p>
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
      ) : (
        <>
          <RecentSearchChips items={recentViews} />
          <WatchlistSection items={watchlist} onRemove={handleRemoveWatchlist} />
          <PopularGrid items={popular} />
        </>
      )}
    </div>
  );
}
