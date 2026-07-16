import { SIGNAL_RING_VAR } from "@/lib/signalColors";
import type { Signal } from "@/lib/types";

const RADIUS = 96;
const CIRCUMFERENCE = Math.PI * RADIUS;
const ARC_PATH = "M 14 110 A 96 96 0 0 1 206 110";

export default function ScoreGauge({ score, signal }: { score: number; signal: Signal }) {
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="relative h-[120px] w-[220px]">
      <svg viewBox="0 0 220 120" className="h-[120px] w-[220px] overflow-visible">
        <path
          d={ARC_PATH}
          fill="none"
          className="stroke-zinc-100 dark:stroke-zinc-800"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <path
          d={ARC_PATH}
          fill="none"
          stroke={SIGNAL_RING_VAR[signal]}
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute top-[58px] right-0 left-0 flex flex-col items-center gap-0.5">
        <span className="font-mono text-4xl leading-none font-extrabold tabular-nums">
          {Math.round(clamped)}
        </span>
        <span className="text-muted text-xs font-medium">/ 100</span>
      </div>
    </div>
  );
}
