import type { AnalysisOut } from "@/lib/types";

const FIELDS: { key: keyof AnalysisOut; label: string }[] = [
  { key: "trend_score", label: "Trend" },
  { key: "momentum_score", label: "Momentum" },
  { key: "risk_score", label: "Risk" },
  { key: "volume_score", label: "Volume" },
  { key: "news_score", label: "News" },
];

function barColorVar(value: number): string {
  if (value >= 70) return "var(--signal-buy-ring)";
  if (value >= 45) return "var(--signal-watch-ring)";
  return "var(--signal-sell-ring)";
}

export default function DetailScores({ analysis }: { analysis: AnalysisOut }) {
  return (
    <section className="card flex flex-col gap-4.5">
      <span className="text-[15px] font-bold">세부 점수</span>
      <div className="flex flex-col gap-3.5">
        {FIELDS.map(({ key, label }) => {
          const value = analysis[key] as number;
          return (
            <div key={key} className="flex items-center gap-3.5">
              <span className="text-muted w-[84px] shrink-0 text-sm font-semibold">{label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-md transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: barColorVar(value) }}
                />
              </div>
              <span className="font-mono w-[30px] text-right text-sm font-bold">
                {Math.round(value)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
