import { formatSignedPct, returnClass } from "@/lib/format";
import type { TradeOut } from "@/lib/types";

interface ActionRow {
  action: "BUY" | "SELL";
  date: string;
  price: number;
  pnlPct: number | null;
}

function toActionRows(trades: TradeOut[]): ActionRow[] {
  const rows: ActionRow[] = [];
  for (const t of trades) {
    rows.push({ action: "BUY", date: t.entry_date, price: t.entry_price, pnlPct: null });
    rows.push({ action: "SELL", date: t.exit_date, price: t.exit_price, pnlPct: t.return_pct });
  }
  return rows;
}

export default function TradeList({ trades }: { trades: TradeOut[] }) {
  if (trades.length === 0) {
    return (
      <div className="card">
        <p className="text-muted text-sm">이 기간 동안 발생한 거래가 없습니다.</p>
      </div>
    );
  }

  const rows = toActionRows(trades);

  return (
    <div className="card flex flex-col gap-0 rounded-2xl p-1">
      <div className="px-4 pt-2.5 pb-2">
        <span className="text-[15px] font-bold">주요 매매 기록</span>
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className="border-border-subtle flex items-center justify-between gap-3 border-t px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className={row.action === "BUY" ? "tag-buy" : "tag-sell"}>{row.action}</span>
            <span className="text-muted font-mono text-[13px]">{row.date}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm font-semibold">{row.price.toLocaleString()}</span>
            <span
              className={`font-mono w-14 text-right text-sm font-bold ${
                row.pnlPct === null ? "text-muted" : returnClass(row.pnlPct)
              }`}
            >
              {row.pnlPct === null ? "" : formatSignedPct(row.pnlPct)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
