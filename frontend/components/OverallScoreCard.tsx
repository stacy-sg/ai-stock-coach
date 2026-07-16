import ScoreGauge from "@/components/ScoreGauge";
import type { AnalysisOut } from "@/lib/types";

export default function OverallScoreCard({ analysis }: { analysis: AnalysisOut }) {
  return (
    <section className="card flex flex-col items-center gap-1">
      <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">종합 점수</span>
      <ScoreGauge score={analysis.total_score} signal={analysis.signal} />
      <span className="text-muted mt-1 text-[13px]">
        Risk 30% · Trend 25% · Volume 20% · Momentum 15% · News 10% 가중 합산
      </span>
    </section>
  );
}
