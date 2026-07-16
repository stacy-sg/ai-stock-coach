"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import GuideBadge from "@/components/GuideBadge";
import SignalBadge from "@/components/SignalBadge";
import { formatSignedPct, returnClass } from "@/lib/format";
import type { HoldingOut } from "@/lib/types";

function formatPrice(value: number, currency: string): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  });
}

export default function HoldingCard({
  holding,
  onSave,
  onDelete,
}: {
  holding: HoldingOut;
  onSave: (id: number, quantity: number, avgPrice: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(String(holding.quantity));
  const [avgPrice, setAvgPrice] = useState(String(holding.avg_price));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(holding.id, Number(quantity), Number(avgPrice));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(holding.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/stocks/${holding.market}/${holding.ticker}`}
          className="hover:text-brand transition-colors"
        >
          <p className="font-semibold">{holding.name}</p>
          <p className="text-muted font-mono text-xs">
            {holding.ticker} · {holding.market}
          </p>
        </Link>
        <Link
          href={`/stocks/${holding.market}/${holding.ticker}`}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          {holding.guide && <GuideBadge guide={holding.guide} />}
          {holding.signal && <SignalBadge signal={holding.signal} />}
        </Link>
      </div>

      {editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="수량"
            className="input-field-sm"
          />
          <input
            type="number"
            value={avgPrice}
            onChange={(e) => setAvgPrice(e.target.value)}
            placeholder="평단가"
            className="input-field-sm"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary-sm"
          >
            <Check className="size-4" />
          </button>
          <button type="button" onClick={() => setEditing(false)} className="btn-icon">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="text-muted text-sm">
            {holding.quantity.toLocaleString()}주 · 평단 {formatPrice(holding.avg_price, holding.currency)}{" "}
            {holding.currency}
          </div>
          <div className="flex items-center gap-3">
            {holding.current_price !== null && holding.return_pct !== null ? (
              <div className="text-right">
                <p className="font-mono text-sm font-semibold">
                  {formatPrice(holding.current_price, holding.currency)} {holding.currency}
                </p>
                <p className={`font-mono text-xs font-semibold ${returnClass(holding.return_pct)}`}>
                  {formatSignedPct(holding.return_pct)}
                </p>
              </div>
            ) : (
              <p className="text-muted text-xs">{holding.note ?? "계산 중"}</p>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-icon"
              aria-label="수정"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="btn-icon-danger"
              aria-label="삭제"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
