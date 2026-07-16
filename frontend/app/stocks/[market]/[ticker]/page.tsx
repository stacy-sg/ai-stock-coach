import StockPageClient from "./StockPageClient";
import type { Market } from "@/lib/types";

export default async function StockPage({
  params,
}: {
  params: Promise<{ market: string; ticker: string }>;
}) {
  const { market, ticker } = await params;
  return <StockPageClient market={market as Market} ticker={ticker} />;
}
