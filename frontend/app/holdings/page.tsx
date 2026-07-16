"use client";

import { useEffect, useState } from "react";
import AddHoldingForm from "@/components/AddHoldingForm";
import HoldingCard from "@/components/HoldingCard";
import HoldingsSummary from "@/components/HoldingsSummary";
import StatusMessage from "@/components/StatusMessage";
import { deleteHolding, listHoldings, updateHolding } from "@/lib/api";
import type { HoldingOut } from "@/lib/types";

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<HoldingOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listHoldings();
        if (!cancelled) setHoldings(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "불러오기에 실패했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(id: number, quantity: number, avgPrice: number) {
    const updated = await updateHolding(id, { quantity, avg_price: avgPrice });
    setHoldings((prev) => prev.map((h) => (h.id === id ? updated : h)));
  }

  async function handleDelete(id: number) {
    await deleteHolding(id);
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">보유 종목</h1>
        <p className="text-muted text-sm">
          수익률과 매도 타이밍 가이드를 한눈에 확인하세요.
        </p>
      </div>

      {loading ? (
        <p className="text-muted py-16 text-center text-sm">불러오는 중...</p>
      ) : error ? (
        <StatusMessage title="불러오지 못했습니다" description={error} />
      ) : (
        <>
          <HoldingsSummary holdings={holdings} />
          <AddHoldingForm onAdded={(h) => setHoldings((prev) => [...prev, h])} />

          {holdings.length === 0 ? (
            <StatusMessage
              variant="info"
              title="아직 등록된 종목이 없어요"
              description="위 버튼으로 보유 종목을 추가해보세요."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {holdings.map((h) => (
                <HoldingCard
                  key={h.id}
                  holding={h}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
