import Link from "next/link";
import { formatSignedPct, returnClass } from "@/lib/format";
import type { PopularStockOut } from "@/lib/types";

export default function PopularGrid({ items }: { items: PopularStockOut[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <span className="px-1 text-[15px] font-bold">지금 많이 찾는 종목</span>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
        {items.map((item) => (
          <Link
            key={`${item.market}:${item.ticker}`}
            href={`/stocks/${item.market}/${item.ticker}`}
            className="card flex items-center justify-between rounded-[14px] p-3.5"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{item.name}</span>
              <span className="text-muted text-xs">{item.ticker}</span>
            </div>
            {item.change_pct !== null && (
              <span className={`font-mono text-[13px] font-bold ${returnClass(item.change_pct)}`}>
                {formatSignedPct(item.change_pct, 1)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
