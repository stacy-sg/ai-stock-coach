import type { Signal } from "@/lib/types";

const BANNER_CLASS: Record<Signal, string> = {
  BUY: "signal-banner-buy",
  HOLD: "signal-banner-hold",
  WATCH: "signal-banner-watch",
  SELL: "signal-banner-sell",
};

// Generic, signal-level copy — not stock-specific. The per-stock reasoning
// lives in the AI 코치의 의견 card below, which is grounded in this stock's
// actual indicators; this banner just explains what the category means.
const DESCRIPTION: Record<Signal, string> = {
  BUY: "지금 매수를 고려해볼 만한 흐름이에요. 다만 한 번에 매수하기보다 분할로 접근해보세요.",
  HOLD: "현재 상태를 유지하며 지켜봐도 괜찮은 구간이에요.",
  WATCH: "아직 확신이 부족해요. 조금 더 지켜본 뒤 판단해도 늦지 않아요.",
  SELL: "리스크 신호가 커지고 있어요. 비중 축소를 고려해볼 시점이에요.",
};

export default function SignalBanner({ signal }: { signal: Signal }) {
  return (
    <div className={`signal-banner ${BANNER_CLASS[signal]}`}>
      <span className="text-[13px] font-bold tracking-wider uppercase opacity-75">
        AI 시그널
      </span>
      <span className="text-[52px] leading-none font-extrabold tracking-tight">{signal}</span>
      <span className="max-w-[420px] text-[15px] font-medium opacity-85">
        {DESCRIPTION[signal]}
      </span>
    </div>
  );
}
