import { Minus, Newspaper, TrendingDown, TrendingUp } from "lucide-react";
import type { NewsOut } from "@/lib/types";

const SENTIMENT_CHIP: Record<string, string> = {
  POSITIVE: "chip-positive",
  NEGATIVE: "chip-negative",
  NEUTRAL: "chip-neutral",
};

const SENTIMENT_ICON: Record<string, typeof TrendingUp> = {
  POSITIVE: TrendingUp,
  NEGATIVE: TrendingDown,
  NEUTRAL: Minus,
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
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const SentimentIcon = item.sentiment ? SENTIMENT_ICON[item.sentiment] : null;
        return (
          <li key={item.url ?? item.title} className="card gap-2 py-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <a
                  href={item.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand text-sm font-semibold transition-colors"
                >
                  {item.title}
                </a>
                <span className="text-muted shrink-0 text-xs">
                  {formatDate(item.published_at)}
                </span>
              </div>
              {item.summary && <p className="text-muted text-sm">{item.summary}</p>}
              {item.sentiment && SentimentIcon && (
                <span className={SENTIMENT_CHIP[item.sentiment] ?? "chip-neutral"}>
                  <SentimentIcon className="size-3" />
                  {item.sentiment}
                  {item.sentiment_score !== null ? ` ${item.sentiment_score.toFixed(1)}` : ""}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
