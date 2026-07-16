"use client";

import { ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import EquityChart from "@/components/EquityChart";
import StatTile from "@/components/StatTile";
import StatusMessage from "@/components/StatusMessage";
import TradeList from "@/components/TradeList";
import { ApiError, runBacktest } from "@/lib/api";
import { formatSignedPct, returnClass } from "@/lib/format";
import type { BacktestOut, Market } from "@/lib/types";

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

  return (
    <div className="page-container">
      <Link href={`/stocks/${market}/${ticker}`} className="link-back">
        <ArrowLeft className="size-3.5" />
        종목 상세로
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">백테스트</h1>
        <p className="text-muted font-mono text-sm">
          {ticker} · {market}
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
        <button type="submit" disabled={loading} className="btn-primary-sm">
          <Play className="size-4" />
          {loading ? "실행 중..." : "실행"}
        </button>
      </form>

      {error && <StatusMessage title="백테스트에 실패했습니다" description={error} />}

      {loading && !error && (
        <p className="text-muted py-16 text-center text-sm">계산 중...</p>
      )}

      {!loading && result && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile
              label="전략 수익률"
              value={formatSignedPct(result.total_return_pct, 1)}
              valueClassName={returnClass(result.total_return_pct)}
            />
            <StatTile
              label="바이앤홀드 수익률"
              value={formatSignedPct(result.buy_hold_return_pct, 1)}
              valueClassName={returnClass(result.buy_hold_return_pct)}
            />
            <StatTile label="거래 횟수" value={String(result.num_trades)} />
            <StatTile
              label="승률"
              value={result.num_trades > 0 ? `${result.win_rate.toFixed(0)}%` : "—"}
            />
            <StatTile
              label="최대 낙폭"
              value={formatSignedPct(result.max_drawdown_pct, 1)}
              valueClassName="value-negative"
            />
            <StatTile label="평가 일수" value={`${result.days_evaluated}일`} />
          </div>

          <section className="card flex flex-col gap-4">
            <h2 className="text-sm font-semibold">수익률 곡선</h2>
            <EquityChart equityCurve={result.equity_curve} buyHoldCurve={result.buy_hold_curve} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="eyebrow">거래 내역</h2>
            <TradeList trades={result.trades} />
          </section>
        </>
      )}
    </div>
  );
}
