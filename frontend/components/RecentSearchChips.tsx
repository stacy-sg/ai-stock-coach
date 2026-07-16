import Link from "next/link";
import type { RecentView } from "@/lib/recentViews";

export default function RecentSearchChips({ items }: { items: RecentView[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <span className="px-1 text-[15px] font-bold">최근 조회한 종목</span>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={`${item.market}:${item.ticker}`}
            href={`/stocks/${item.market}/${item.ticker}`}
            className="border-border-subtle bg-surface flex items-center gap-1.5 rounded-full border py-2 pr-3.5 pl-3 transition-shadow hover:shadow-sm"
          >
            <span className="text-sm font-semibold">{item.name}</span>
            <span className="text-muted text-xs font-medium">{item.ticker}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
