import { notFound } from "next/navigation";
import BacktestPageClient from "./BacktestPageClient";
import { isMarket } from "@/lib/types";

export default async function BacktestPage({
  params,
}: {
  params: Promise<{ market: string; ticker: string }>;
}) {
  const { market, ticker } = await params;
  if (!isMarket(market)) {
    notFound();
  }
  return <BacktestPageClient market={market} ticker={ticker} />;
}
