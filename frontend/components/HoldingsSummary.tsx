import { formatSignedPct, returnClass } from "@/lib/format";
import type { HoldingOut } from "@/lib/types";

export default function HoldingsSummary({ holdings }: { holdings: HoldingOut[] }) {
  const byCurrency = new Map<string, { invested: number; current: number }>();
  for (const h of holdings) {
    if (h.current_price === null) continue;
    const entry = byCurrency.get(h.currency) ?? { invested: 0, current: 0 };
    entry.invested += h.quantity * h.avg_price;
    entry.current += h.quantity * h.current_price;
    byCurrency.set(h.currency, entry);
  }

  if (byCurrency.size === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[...byCurrency.entries()].map(([currency, { invested, current }]) => {
        const returnPct = ((current - invested) / invested) * 100;
        return (
          <div key={currency} className="card flex flex-col gap-1">
            <p className="eyebrow">{currency} 평가금액</p>
            <p className="font-mono text-2xl font-bold">
              {current.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
            <p className={`font-mono text-sm font-semibold ${returnClass(returnPct)}`}>
              {formatSignedPct(returnPct)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
