import BacktestPageClient from "./BacktestPageClient";
import type { Market } from "@/lib/types";

export default async function BacktestPage({
  params,
}: {
  params: Promise<{ market: string; ticker: string }>;
}) {
  const { market, ticker } = await params;
  return <BacktestPageClient market={market as Market} ticker={ticker} />;
}
