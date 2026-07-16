"use client";

import { ArrowLeft, LineChart, RefreshCw, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AnalysisReport from "@/components/AnalysisReport";
import DetailScores from "@/components/DetailScores";
import NewsList from "@/components/NewsList";
import OverallScoreCard from "@/components/OverallScoreCard";
import PriceHeader from "@/components/PriceHeader";
import SignalBanner from "@/components/SignalBanner";
import StatusMessage from "@/components/StatusMessage";
import StockPageSkeleton from "@/components/StockPageSkeleton";
import {
  addWatchlist,
  ApiError,
  getAnalysis,
  getNews,
  getStock,
  listWatchlist,
  removeWatchlist,
} from "@/lib/api";
import { recordRecentView } from "@/lib/recentViews";
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
  const [watchlistId, setWatchlistId] = useState<number | null>(null);
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  async function toggleWatchlist() {
    setWatchlistBusy(true);
    try {
      if (watchlistId !== null) {
        await removeWatchlist(watchlistId);
        setWatchlistId(null);
      } else {
        const item = await addWatchlist(ticker, market);
        setWatchlistId(item.id);
      }
    } catch {
      // best-effort UI toggle — a failed add/remove just leaves the star as-is
    } finally {
      setWatchlistBusy(false);
    }
  }

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
        recordRecentView({ ticker: stockData.ticker, market: stockData.market, name: stockData.name });
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

  useEffect(() => {
    let cancelled = false;
    listWatchlist()
      .then((items) => {
        if (cancelled) return;
        const match = items.find((i) => i.ticker === ticker && i.market === market);
        setWatchlistId(match?.id ?? null);
      })
      .catch(() => {
        // best-effort — the star just stays in its default (not-added) state
      });
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
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="link-back">
          <ArrowLeft className="size-3.5" />
          검색으로
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleWatchlist}
            disabled={watchlistBusy}
            className="btn-icon"
            aria-label={watchlistId !== null ? "관심 종목에서 제거" : "관심 종목에 추가"}
          >
            <Star
              className={`size-4 ${watchlistId !== null ? "fill-brand text-brand" : ""}`}
            />
          </button>
          <Link
            href={`/stocks/${market}/${ticker}/backtest`}
            className="btn-icon"
            aria-label="백테스트"
          >
            <LineChart className="size-4" />
          </Link>
          <button type="button" onClick={reanalyze} disabled={reanalyzing} className="btn-primary">
            <RefreshCw className={`size-4 ${reanalyzing ? "animate-spin" : ""}`} />
            다시 분석
          </button>
        </div>
      </div>

      <PriceHeader
        name={stock.name}
        ticker={stock.ticker}
        market={stock.market}
        sector={stock.sector}
        close={analysis?.close ?? null}
        changePct={analysis?.change_pct ?? null}
      />

      {analysis ? (
        <>
          <SignalBanner signal={analysis.signal} />
          <AnalysisReport report={analysis.llm_report} />
          <OverallScoreCard analysis={analysis} />
          <DetailScores analysis={analysis} />
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
        <h2 className="eyebrow">최근 뉴스</h2>
        <NewsList items={news} />
      </section>
    </div>
  );
}
