"use client";

import { useMemo, useState } from "react";
import { formatSignedPct } from "@/lib/format";
import type { EquityPointOut } from "@/lib/types";

const WIDTH = 640;
const HEIGHT = 280;
const PADDING = { top: 16, right: 12, bottom: 8, left: 48 };

// The strategy line's identity color — always green, regardless of whether
// this particular run beat the market. Reuses the BUY signal ring token
// rather than a one-off hex so it stays in sync with the rest of the app's
// signal palette if that ever changes.
const STRATEGY_COLOR = "var(--signal-buy-ring)";

function toReturnSeries(points: EquityPointOut[]): number[] {
  return points.map((p) => (p.equity - 1) * 100);
}

function formatPct(v: number): string {
  return formatSignedPct(v, 1);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ko-KR", { year: "2-digit", month: "short", day: "numeric" });
}

export default function EquityChart({
  equityCurve,
  buyHoldCurve,
}: {
  equityCurve: EquityPointOut[];
  buyHoldCurve: EquityPointOut[];
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const strategy = useMemo(() => toReturnSeries(equityCurve), [equityCurve]);
  const benchmark = useMemo(() => toReturnSeries(buyHoldCurve), [buyHoldCurve]);
  const dates = equityCurve.map((p) => p.date);
  const n = dates.length;

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const allValues = [...strategy, ...benchmark];
  const minV = Math.min(0, ...allValues);
  const maxV = Math.max(0, ...allValues);
  const span = maxV - minV || 1;
  const domainMin = minV - span * 0.1;
  const domainMax = maxV + span * 0.1;

  const xAt = (i: number) => PADDING.left + (n <= 1 ? 0 : (i / (n - 1)) * innerWidth);
  const yAt = (v: number) =>
    PADDING.top + innerHeight - ((v - domainMin) / (domainMax - domainMin)) * innerHeight;
  const pathFor = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`).join(" ");

  const zeroY = yAt(0);
  const yTicks = [domainMin, (domainMin + domainMax) / 2, domainMax];

  function handlePointerMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(ratio * (n - 1)));
  }

  if (n === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ background: STRATEGY_COLOR }} />
          <span className="text-muted">전략</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          <span className="text-muted">바이앤홀드</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="백테스트 전략 대비 바이앤홀드 수익률 곡선"
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yAt(t)}
              y2={yAt(t)}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={yAt(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-zinc-400 text-[10px] dark:fill-zinc-500"
            >
              {formatPct(t)}
            </text>
          </g>
        ))}

        <path
          d={`${pathFor(strategy)} L${xAt(n - 1).toFixed(2)},${zeroY} L${xAt(0).toFixed(2)},${zeroY} Z`}
          fill={STRATEGY_COLOR}
          opacity={0.1}
        />

        <path
          d={pathFor(benchmark)}
          fill="none"
          className="stroke-zinc-400 dark:stroke-zinc-600"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={pathFor(strategy)}
          fill="none"
          stroke={STRATEGY_COLOR}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hoverIndex !== null && (
          <>
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              className="stroke-zinc-300 dark:stroke-zinc-700"
              strokeWidth={1}
            />
            <circle
              cx={xAt(hoverIndex)}
              cy={yAt(strategy[hoverIndex])}
              r={4}
              fill={STRATEGY_COLOR}
              className="stroke-surface"
              strokeWidth={2}
            />
            <circle
              cx={xAt(hoverIndex)}
              cy={yAt(benchmark[hoverIndex])}
              r={4}
              className="fill-zinc-400 stroke-surface dark:fill-zinc-600"
              strokeWidth={2}
            />
          </>
        )}

        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={innerWidth}
          height={innerHeight}
          fill="transparent"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      <div className="border-border-subtle bg-surface flex items-center justify-between rounded-xl border px-4 py-2 text-xs">
        {hoverIndex !== null ? (
          <>
            <span className="text-muted">{formatDate(dates[hoverIndex])}</span>
            <span className="flex gap-4 font-mono font-semibold">
              <span style={{ color: STRATEGY_COLOR }}>전략 {formatPct(strategy[hoverIndex])}</span>
              <span className="text-muted">바이앤홀드 {formatPct(benchmark[hoverIndex])}</span>
            </span>
          </>
        ) : (
          <span className="text-muted">차트 위에 마우스를 올리면 날짜별 수익률을 볼 수 있어요.</span>
        )}
      </div>
    </div>
  );
}
