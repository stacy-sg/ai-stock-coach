"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import StockPicker from "@/components/StockPicker";
import { createHolding } from "@/lib/api";
import type { HoldingOut, StockSearchResult } from "@/lib/types";

export default function AddHoldingForm({
  onAdded,
}: {
  onAdded: (holding: HoldingOut) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<StockSearchResult | null>(null);
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPicked(null);
    setQuantity("");
    setAvgPrice("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) return;

    setSubmitting(true);
    setError(null);
    try {
      const holding = await createHolding({
        ticker: picked.ticker,
        market: picked.market,
        quantity: Number(quantity),
        avg_price: Number(avgPrice),
      });
      onAdded(holding);
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary self-start">
        <Plus className="size-4" />
        종목 추가
      </button>
    );
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">보유 종목 추가</h2>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="btn-icon"
        >
          <X className="size-4" />
        </button>
      </div>

      {!picked ? (
        <StockPicker onSelect={setPicked} />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="selected-row">
            <div>
              <p className="font-medium">{picked.name}</p>
              <p className="text-muted text-xs">
                {picked.ticker} · {picked.market}
              </p>
            </div>
            <button type="button" onClick={() => setPicked(null)} className="link-back">
              다시 선택
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="수량"
              className="input-field-sm flex-1"
            />
            <input
              type="number"
              step="any"
              required
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              placeholder="평균 매수가"
              className="input-field-sm flex-1"
            />
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "추가 중..." : "추가"}
          </button>
        </form>
      )}
    </div>
  );
}
