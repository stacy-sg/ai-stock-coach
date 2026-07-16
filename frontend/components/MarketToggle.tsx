import type { Market } from "@/lib/types";

const MARKET_LABEL: Record<Market, string> = {
  KR: "한국",
  US: "미국",
};

const MARKETS: Market[] = ["KR", "US"];

export default function MarketToggle({
  value,
  onChange,
}: {
  value: Market;
  onChange: (market: Market) => void;
}) {
  return (
    <div className="btn-toggle-group">
      {MARKETS.map((market) => (
        <button
          key={market}
          type="button"
          onClick={() => onChange(market)}
          className={market === value ? "btn-toggle-active" : "btn-toggle"}
        >
          {MARKET_LABEL[market]}
        </button>
      ))}
    </div>
  );
}
