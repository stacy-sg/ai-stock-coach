import { formatSignedPct, returnClass } from "@/lib/format";
import type { TradeOut } from "@/lib/types";

export default function TradeList({ trades }: { trades: TradeOut[] }) {
  if (trades.length === 0) {
    return (
      <div className="card">
        <p className="text-muted text-sm">이 기간 동안 발생한 거래가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted border-border-subtle border-b text-left text-xs">
            <th className="py-2 pr-4 font-medium">진입일</th>
            <th className="py-2 pr-4 font-medium">진입가</th>
            <th className="py-2 pr-4 font-medium">청산일</th>
            <th className="py-2 pr-4 font-medium">청산가</th>
            <th className="py-2 text-right font-medium">수익률</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={i} className="border-border-subtle border-b last:border-0">
              <td className="py-2 pr-4 font-mono">{t.entry_date}</td>
              <td className="py-2 pr-4 font-mono">{t.entry_price.toLocaleString()}</td>
              <td className="py-2 pr-4 font-mono">{t.exit_date}</td>
              <td className="py-2 pr-4 font-mono">{t.exit_price.toLocaleString()}</td>
              <td className={`py-2 text-right font-mono font-semibold ${returnClass(t.return_pct)}`}>
                {formatSignedPct(t.return_pct)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
