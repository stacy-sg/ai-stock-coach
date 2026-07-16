import { ArrowDownRight, ArrowUpRight, Eye, Minus } from "lucide-react";
import type { Signal } from "@/lib/types";

const BADGE_CLASS: Record<Signal, string> = {
  BUY: "badge-buy",
  HOLD: "badge-hold",
  WATCH: "badge-watch",
  SELL: "badge-sell",
};

const LABEL: Record<Signal, string> = {
  BUY: "매수",
  HOLD: "보유",
  WATCH: "관망",
  SELL: "매도",
};

const DESCRIPTION: Record<Signal, string> = {
  BUY: "정량 점수 종합 70점 이상 — 추세·모멘텀 등이 강한 매수 우위 구간이에요.",
  HOLD: "정량 점수 종합 50~69점 — 뚜렷한 방향성 없이 보합권이에요.",
  WATCH: "정량 점수 종합 30~49점 — 지표가 약해지고 있어 지켜볼 필요가 있어요.",
  SELL: "정량 점수 종합 30점 미만 — 추세·리스크 지표가 매도 우위를 가리켜요.",
};

const ICON: Record<Signal, typeof ArrowUpRight> = {
  BUY: ArrowUpRight,
  HOLD: Minus,
  WATCH: Eye,
  SELL: ArrowDownRight,
};

export default function SignalBadge({ signal }: { signal: Signal }) {
  const Icon = ICON[signal];
  return (
    <span className={BADGE_CLASS[signal]} title={DESCRIPTION[signal]}>
      <Icon className="size-4" strokeWidth={2.5} />
      {LABEL[signal]}
    </span>
  );
}
