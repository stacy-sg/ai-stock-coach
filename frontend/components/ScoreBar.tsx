import type { ComponentType } from "react";

// Mirrors the BUY/HOLD/WATCH/SELL score thresholds so a sub-score's color
// reads consistently with the overall signal.
function fillClass(value: number): string {
  if (value >= 70) return "bg-emerald-500";
  if (value >= 50) return "bg-blue-500";
  if (value >= 30) return "bg-amber-500";
  return "bg-red-500";
}

export default function ScoreBar({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-3">
      <Icon className="text-muted size-4 shrink-0" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted font-medium">{label}</span>
          <span className="font-mono font-semibold tabular-nums">{value.toFixed(0)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${fillClass(value)}`}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    </div>
  );
}
