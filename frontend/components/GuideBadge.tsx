import type { HoldingGuide } from "@/lib/types";

const BADGE_CLASS: Record<HoldingGuide, string> = {
  "보유": "badge-buy",
  "분할 익절": "badge-hold",
  "관망": "badge-watch",
  "리스크 경고": "badge-sell",
};

const DESCRIPTION: Record<HoldingGuide, string> = {
  "보유": "매수 신호 유지 중 — 계속 보유를 고려할 수 있어요.",
  "분할 익절": "수익률이 양호하고 신호가 다소 약해졌어요 — 일부 물량 익절을 고려할 수 있어요.",
  "관망": "뚜렷한 신호가 없어요 — 추가 매수/매도보다는 지켜보는 걸 고려할 수 있어요.",
  "리스크 경고": "매도 신호이거나 변동성이 커요 — 리스크 관리가 필요할 수 있어요.",
};

export default function GuideBadge({ guide }: { guide: HoldingGuide }) {
  return (
    <span className={BADGE_CLASS[guide]} title={DESCRIPTION[guide]}>
      {guide}
    </span>
  );
}
