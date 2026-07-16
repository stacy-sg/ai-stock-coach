"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { formatPrice, formatSignedPct, returnClass } from "@/lib/format";
import { SIGNAL_RING_VAR } from "@/lib/signalColors";
import type { WatchlistOut } from "@/lib/types";

export default function WatchlistSection({
  items,
  onRemove,
  showHeader = true,
}: {
  items: WatchlistOut[];
  onRemove: (id: number) => void;
  showHeader?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {showHeader && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[15px] font-bold">내 관심 종목</span>
          <Link href="/watchlist" className="text-brand text-[13px] font-semibold">
            전체보기
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card">
          <p className="text-muted text-sm">
            아직 관심 종목이 없어요. 종목 상세 화면에서 별 아이콘을 눌러 추가해보세요.
          </p>
        </div>
      ) : (
        <div className="border-border-subtle bg-surface overflow-hidden rounded-[20px] border">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`group flex items-center justify-between gap-3 px-5 py-4 ${
                i > 0 ? "border-border-subtle border-t" : ""
              }`}
            >
              <Link
                href={`/stocks/${item.market}/${item.ticker}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="avatar-neutral">{item.name.charAt(0)}</span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-semibold">{item.name}</span>
                  {item.signal && (
                    <span
                      className="text-xs font-semibold"
                      style={{ color: SIGNAL_RING_VAR[item.signal] }}
                    >
                      {item.signal}
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex items-center gap-3">
                {item.close !== null && (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-[15px] font-bold tabular-nums">
                      {formatPrice(item.close, item.market === "KR" ? "KRW" : "USD")}
                    </span>
                    {item.change_pct !== null && (
                      <span
                        className={`font-mono text-[13px] font-semibold ${returnClass(item.change_pct)}`}
                      >
                        {formatSignedPct(item.change_pct, 1)}
                      </span>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="btn-icon opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="관심 종목에서 제거"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
