"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { addWatchlist, removeWatchlist } from "@/lib/api";
import type { Market, WatchlistOut } from "@/lib/types";

export default function WatchlistToggleButton({
  ticker,
  market,
  watchlistId,
  onAdded,
  onRemoved,
}: {
  ticker: string;
  market: Market;
  watchlistId: number | null;
  onAdded: (item: WatchlistOut) => void;
  onRemoved: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    // Rows using this button are usually whole-row <Link>s to the stock
    // detail page — don't let the click bubble into a navigation.
    e.preventDefault();
    e.stopPropagation();

    setBusy(true);
    try {
      if (watchlistId !== null) {
        await removeWatchlist(watchlistId);
        onRemoved();
      } else {
        const item = await addWatchlist(ticker, market);
        onAdded(item);
      }
    } catch {
      // best-effort — a failed toggle just leaves the star as-is
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="btn-icon"
      aria-label={watchlistId !== null ? "관심 종목에서 제거" : "관심 종목에 추가"}
    >
      <Star className={`size-4 ${watchlistId !== null ? "fill-brand text-brand" : ""}`} />
    </button>
  );
}
