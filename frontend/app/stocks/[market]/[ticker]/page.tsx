import { notFound } from "next/navigation";
import StockPageClient from "./StockPageClient";
import { isMarket } from "@/lib/types";

export default async function StockPage({
  params,
}: {
  params: Promise<{ market: string; ticker: string }>;
}) {
  const { market, ticker } = await params;
  // A 2-segment URL like /stocks/AAPL/backtest resolves here too (market=
  // "AAPL", ticker="backtest") since Next.js doesn't validate route param
  // values — without this check it'd sail through to a 422 from the API.
  if (!isMarket(market)) {
    notFound();
  }
  return <StockPageClient market={market} ticker={ticker} />;
}
