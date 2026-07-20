import { formatSignedPct } from "@/lib/format";

export default function BacktestResultBanner({
  totalReturnPct,
  vsHoldPct,
}: {
  totalReturnPct: number;
  vsHoldPct: number;
}) {
  const positive = totalReturnPct >= 0;

  return (
    <div className={`signal-banner ${positive ? "signal-banner-buy" : "signal-banner-sell"}`}>
      <span className="text-[13px] font-bold tracking-wider uppercase opacity-80">
        전략 총 수익률
      </span>
      <span className="font-mono text-[52px] leading-none font-extrabold">
        {formatSignedPct(totalReturnPct, 1)}
      </span>
      <span className="text-[15px] font-medium opacity-90">
        단순 보유(Buy &amp; Hold) 대비 {formatSignedPct(vsHoldPct, 1)}p {vsHoldPct >= 0 ? "우위" : "열위"}
      </span>
    </div>
  );
}
