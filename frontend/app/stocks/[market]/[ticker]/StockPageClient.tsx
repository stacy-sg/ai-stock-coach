"use client";

import { ArrowLeft, LineChart, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AnalysisReport from "@/components/AnalysisReport";
import NewsList from "@/components/NewsList";
import ScorePanel from "@/components/ScorePanel";
import StatusMessage from "@/components/StatusMessage";
import StockPageSkeleton from "@/components/StockPageSkeleton";
import { ApiError, getAnalysis, getNews, getStock } from "@/lib/api";
import type { AnalysisOut, Market, NewsOut, StockDetail } from "@/lib/types";

function toApiError(err: unknown, fallback: string): ApiError {
  return err instanceof ApiError ? err : new ApiError(500, fallback);
}

export default function StockPageClient({
  market,
  ticker,
}: {
  market: Market;
  ticker: string;
}) {
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [news, setNews] = useState<NewsOut[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisOut | null>(null);
  const [analysisError, setAnalysisError] = useState<ApiError | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);

  async function reanalyze() {
    setReanalyzing(true);
    setAnalysisError(null);
    try {
      setAnalysis(await getAnalysis(ticker, market, true));
    } catch (err) {
      setAnalysisError(toApiError(err, "재분석에 실패했습니다."));
    } finally {
      setReanalyzing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFatalError(null);
      setAnalysisError(null);

      // Stock info + news rarely fail even for freshly-listed tickers, so
      // load them independently from analysis — a stock with too little
      // price history to score should still show its name and news.
      try {
        const [stockData, newsData] = await Promise.all([
          getStock(ticker, market),
          getNews(ticker, market),
        ]);
        if (cancelled) return;
        setStock(stockData);
        setNews(newsData);
      } catch (err) {
        if (!cancelled) {
          setFatalError(toApiError(err, "불러오기에 실패했습니다.").detail);
          setLoading(false);
        }
        return;
      }

      try {
        const analysisData = await getAnalysis(ticker, market);
        if (!cancelled) setAnalysis(analysisData);
      } catch (err) {
        if (!cancelled) setAnalysisError(toApiError(err, "분석에 실패했습니다."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [market, ticker]);

  if (loading) {
    return <StockPageSkeleton />;
  }

  if (fatalError) {
    return <StatusMessage title="불러오지 못했습니다" description={fatalError} />;
  }

  if (!stock) {
    return null;
  }

  return (
    <div className="page-container">
      <Link href="/" className="link-back">
        <ArrowLeft className="size-3.5" />
        검색으로
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{stock.name}</h1>
          <p className="text-muted font-mono text-sm">
            {stock.ticker} · {stock.market}
            {stock.sector ? ` · ${stock.sector}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/stocks/${market}/${ticker}/backtest`} className="btn-icon" aria-label="백테스트">
            <LineChart className="size-4" />
          </Link>
          <button
            type="button"
            onClick={reanalyze}
            disabled={reanalyzing}
            className="btn-primary"
          >
            <RefreshCw className={`size-4 ${reanalyzing ? "animate-spin" : ""}`} />
            다시 분석
          </button>
        </div>
      </div>

      {analysis ? (
        <>
          <ScorePanel analysis={analysis} />
          <AnalysisReport report={analysis.llm_report} />
        </>
      ) : analysisError ? (
        <StatusMessage
          variant="info"
          title={
            analysisError.status === 422
              ? "아직 분석하기엔 데이터가 부족해요"
              : "분석에 실패했습니다"
          }
          description={
            analysisError.status === 422
              ? "최근 상장된 종목은 점수를 계산할 만큼 가격 이력이 쌓이지 않았을 수 있어요. 시간이 지난 후 다시 시도해주세요."
              : analysisError.detail
          }
        />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow">관련 뉴스</h2>
        <NewsList items={news} />
      </section>
    </div>
  );
}
