import { formatPrice, formatSignedPct, returnClass } from "@/lib/format";
import type { Market } from "@/lib/types";

const CURRENCY_LABEL: Record<Market, string> = {
  KR: "원",
  US: "USD",
};

const CURRENCY_CODE: Record<Market, string> = {
  KR: "KRW",
  US: "USD",
};

export default function PriceHeader({
  name,
  ticker,
  market,
  sector,
  close,
  changePct,
}: {
  name: string;
  ticker: string;
  market: Market;
  sector: string | null;
  close: number | null;
  changePct: number | null;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[22px] font-bold tracking-tight">{name}</span>
        <span className="chip-ticker">{ticker}</span>
        <span className="chip-market">{market}</span>
        {sector && <span className="text-muted text-sm">{sector}</span>}
      </div>

      {close !== null && (
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-[42px] font-bold tracking-tight tabular-nums">
            {formatPrice(close, CURRENCY_CODE[market])}
          </span>
          <span className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
            {CURRENCY_LABEL[market]}
          </span>
          {changePct !== null && (
            <span className={`font-mono text-[17px] font-bold ${returnClass(changePct)}`}>
              {formatSignedPct(changePct, 1)}
            </span>
          )}
        </div>
      )}

      <div className="text-muted flex items-center gap-1.5 text-[13px]">
        <span className="inline-block size-[5px] rounded-full bg-zinc-400 dark:bg-zinc-600" />
        <span>15~20분 지연된 시세 정보입니다</span>
      </div>
    </div>
  );
}
