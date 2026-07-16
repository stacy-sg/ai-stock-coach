import { BarChart3, Newspaper, ShieldAlert, TrendingUp, Zap } from "lucide-react";
import ScoreBar from "@/components/ScoreBar";
import SignalBadge from "@/components/SignalBadge";
import type { AnalysisOut } from "@/lib/types";

const SCORE_FIELDS: {
  key: keyof AnalysisOut;
  label: string;
  icon: typeof TrendingUp;
}[] = [
  { key: "trend_score", label: "추세", icon: TrendingUp },
  { key: "momentum_score", label: "모멘텀", icon: Zap },
  { key: "risk_score", label: "리스크", icon: ShieldAlert },
  { key: "volume_score", label: "거래량", icon: BarChart3 },
  { key: "news_score", label: "뉴스", icon: Newspaper },
];

export default function ScorePanel({ analysis }: { analysis: AnalysisOut }) {
  return (
    <section className="card flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">종합 점수</p>
          <p className="font-mono text-4xl font-bold tabular-nums">
            {analysis.total_score.toFixed(1)}
          </p>
        </div>
        <SignalBadge signal={analysis.signal} />
      </div>

      <div className="flex flex-col gap-4">
        {SCORE_FIELDS.map(({ key, label, icon }) => (
          <ScoreBar key={key} label={label} value={analysis[key] as number} icon={icon} />
        ))}
      </div>
    </section>
  );
}
