import { Newspaper } from "lucide-react";
import type { NewsOut } from "@/lib/types";

const SENTIMENT_CHIP: Record<string, string> = {
  POSITIVE: "chip-positive",
  NEGATIVE: "chip-negative",
  NEUTRAL: "chip-neutral",
};

const SENTIMENT_LABEL: Record<string, string> = {
  POSITIVE: "긍정",
  NEGATIVE: "부정",
  NEUTRAL: "중립",
};

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export default function NewsList({ items }: { items: NewsOut[] }) {
  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 py-10 text-center">
        <Newspaper className="text-muted size-6" />
        <p className="text-muted text-sm">관련 뉴스가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
      {items.map((item) => (
        <a
          key={item.url ?? item.title}
          href={item.url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="card flex flex-col gap-2 rounded-2xl p-[18px] transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            {item.sentiment && (
              <span className={SENTIMENT_CHIP[item.sentiment] ?? "chip-neutral"}>
                {SENTIMENT_LABEL[item.sentiment] ?? item.sentiment}
              </span>
            )}
            <span className="text-muted text-xs">{formatDate(item.published_at)}</span>
          </div>
          <span className="text-[15px] leading-[1.4] font-bold">{item.title}</span>
          {item.summary && (
            <p className="text-[13.5px] leading-[1.55] text-zinc-500 dark:text-zinc-400">
              {item.summary}
            </p>
          )}
          {item.source && <span className="text-muted mt-0.5 text-xs">{item.source}</span>}
        </a>
      ))}
    </div>
  );
}
