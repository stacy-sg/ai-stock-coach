import { Fragment } from "react";

function formatDate(value: string): string {
  return value.replaceAll("-", ".");
}

export default function BacktestSetupBar({
  stockName,
  ticker,
  startDate,
  endDate,
  initialCapital,
  currencyLabel,
}: {
  stockName: string;
  ticker: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  currencyLabel: string;
}) {
  const fields = [
    { label: "종목", value: `${stockName} (${ticker})` },
    { label: "기간", value: `${formatDate(startDate)} ~ ${formatDate(endDate)}` },
    { label: "초기 투자금", value: `${initialCapital.toLocaleString()}${currencyLabel}` },
  ];

  return (
    <div className="card flex flex-wrap items-center gap-5 rounded-2xl p-[18px]">
      {fields.map((field, i) => (
        <Fragment key={field.label}>
          {i > 0 && <span className="bg-border-subtle h-7 w-px" />}
          <div className="flex flex-col gap-0.5">
            <span className="text-muted text-xs font-semibold">{field.label}</span>
            <span className="text-[15px] font-bold">{field.value}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
