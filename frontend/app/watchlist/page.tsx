"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import StatusMessage from "@/components/StatusMessage";
import WatchlistSection from "@/components/WatchlistSection";
import { listWatchlist, removeWatchlist } from "@/lib/api";
import type { WatchlistOut } from "@/lib/types";

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listWatchlist()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "불러오기에 실패했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRemove(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await removeWatchlist(id);
    } catch {
      // failed removal — refetch to reconcile the optimistic update
      listWatchlist().then(setItems).catch(() => {});
    }
  }

  return (
    <div className="page-container">
      <Link href="/" className="link-back">
        <ArrowLeft className="size-3.5" />
        홈으로
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">관심 종목</h1>

      {loading ? (
        <p className="text-muted py-16 text-center text-sm">불러오는 중...</p>
      ) : error ? (
        <StatusMessage title="불러오지 못했습니다" description={error} />
      ) : (
        <WatchlistSection items={items} onRemove={handleRemove} showHeader={false} />
      )}
    </div>
  );
}
