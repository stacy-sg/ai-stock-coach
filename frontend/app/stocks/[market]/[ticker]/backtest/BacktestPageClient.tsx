"use client";

import { ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AiCommentCard from "@/components/AiCommentCard";
import BacktestResultBanner from "@/components/BacktestResultBanner";
import BacktestSetupBar from "@/components/BacktestSetupBar";
import EquityChart from "@/components/EquityChart";
import StatTile from "@/components/StatTile";
import StatusMessage from "@/components/StatusMessage";
import TradeList from "@/components/TradeList";
import { ApiError, runBacktest } from "@/lib/api";
import { formatSignedPct } from "@/lib/format";
import type { BacktestOut, Market } from "@/lib/types";

const DEFAULT_CAPITAL: Record<Market, number> = { KR: 10_000_000, US: 10_000 };
const CURRENCY_LABEL: Record<Market, string> = { KR: "원", US: "USD" };

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  return { start: isoDate(start), end: isoDate(end) };
}

export default function BacktestPageClient({
  market,
  ticker,
}: {
  market: Market;
  ticker: string;
}) {
  const [{ start: defaultStart, end: defaultEnd }] = useState(defaultRange);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [initialCapital, setInitialCapital] = useState(DEFAULT_CAPITAL[market]);
  const [result, setResult] = useState<BacktestOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setResult(await runBacktest(ticker, market, startDate, endDate));
    } catch (err) {
      setResult(null);
      setError(
        err instanceof ApiError ? err.detail : err instanceof Error ? err.message : "백테스트에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const data = await runBacktest(ticker, market, defaultStart, defaultEnd);
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) {
          setResult(null);
          setError(
            err instanceof ApiError
              ? err.detail
              : err instanceof Error
                ? err.message
                : "백테스트에 실패했습니다."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vsHoldPct = result ? result.total_return_pct - result.buy_hold_return_pct : 0;
  const currentValue = result ? initialCapital * (1 + result.total_return_pct / 100) : 0;

  return (
    <div className="page-container">
      <Link href={`/stocks/${market}/${ticker}`} className="link-back">
        <ArrowLeft className="size-3.5" />
        종목 상세로
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">백테스트 결과</h1>
        <p className="text-muted text-sm leading-[1.6]">
          AI 코치의 시그널을 과거에 그대로 따랐다면 어땠을지 시뮬레이션한 결과예요. 실제 투자
          성과를 보장하지 않아요.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="card flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">시작일</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">종료일</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">초기 투자금 ({CURRENCY_LABEL[market]})</span>
          <input
            type="number"
            min={0}
            value={initialCapital}
            onChange={(e) => setInitialCapital(Number(e.target.value))}
            className="input-field-sm"
          />
        </label>
        <button type="submit" disabled={loading} className="btn-primary-sm">
          <Play className="size-4" />
          {loading ? "실행 중..." : "실행"}
        </button>
      </form>

      {error && <StatusMessage title="백테스트에 실패했습니다" description={error} />}

      {loading && !error && <p className="text-muted py-16 text-center text-sm">계산 중...</p>}

      {!loading && result && (
        <>
          <BacktestSetupBar
            stockName={result.name}
            ticker={result.ticker}
            startDate={result.start_date}
            endDate={result.end_date}
            initialCapital={initialCapital}
            currencyLabel={CURRENCY_LABEL[market]}
          />

          <BacktestResultBanner totalReturnPct={result.total_return_pct} vsHoldPct={vsHoldPct} />

          <p className="text-muted -mt-2 text-center text-xs">
            {Math.round(currentValue).toLocaleString()}
            {CURRENCY_LABEL[market]}으로 평가돼요 (초기 투자금 {initialCapital.toLocaleString()}
            {CURRENCY_LABEL[market]} 기준)
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="연환산 수익률"
              value={formatSignedPct(result.cagr_pct, 1)}
              hint="CAGR 기준"
              valueClassName={result.cagr_pct >= 0 ? "value-positive" : "value-negative"}
            />
            <StatTile
              label="최대 낙폭"
              value={formatSignedPct(result.max_drawdown_pct, 1)}
              hint="MDD, 가장 크게 하락한 폭"
              valueClassName="value-negative"
            />
            <StatTile
              label="승률"
              value={result.num_trades > 0 ? `${result.win_rate.toFixed(0)}%` : "—"}
              hint="수익 낸 거래 비율"
            />
            <StatTile
              label="총 거래"
              value={`${result.num_trades * 2}회`}
              hint="매수·매도 합계"
            />
          </div>

          <section className="card flex flex-col gap-4">
            <h2 className="text-[15px] font-bold">자산 변화 추이</h2>
            <EquityChart equityCurve={result.equity_curve} buyHoldCurve={result.buy_hold_curve} />
          </section>

          <AiCommentCard
            title="이 결과를 어떻게 봐야 할까요?"
            comment={result.ai_comment}
            fallback="AI 해석 생성에 실패했습니다. 지표는 위 수치를 참고해주세요."
          />

          <TradeList trades={result.trades} />

          <p className="text-muted px-1 text-center text-xs leading-[1.6]">
            과거 데이터 기반 시뮬레이션이며 미래 수익을 보장하지 않아요. 투자 판단과 책임은
            본인에게 있어요.
          </p>
        </>
      )}
    </div>
  );
}
