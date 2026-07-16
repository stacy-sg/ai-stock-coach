import Markdown, { type Components } from "react-markdown";

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => <p className="text-lg font-bold">{children}</p>,
  h2: ({ children }) => <p className="text-base font-bold">{children}</p>,
  h3: ({ children }) => <p className="text-[15px] font-bold">{children}</p>,
  p: ({ children }) => <p>{children}</p>,
  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="flex flex-col gap-2">{children}</ul>,
  ol: ({ children }) => <ol className="flex flex-col gap-2">{children}</ol>,
  li: ({ children }) => (
    <li className="flex gap-2.5">
      <span className="bg-brand mt-2.5 size-1.5 shrink-0 rounded-full" />
      <span>{children}</span>
    </li>
  ),
  // The report never links out, and LLM output shouldn't drive navigation
  // anyway — render link text as plain text instead of a clickable <a>.
  a: ({ children }) => <span>{children}</span>,
};

export default function AnalysisReport({ report }: { report: string | null }) {
  return (
    <section className="card flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <span className="avatar-brand">AI</span>
        <span className="text-[15px] font-bold">AI 코치의 의견</span>
      </div>

      {report ? (
        <div className="flex flex-col gap-3 text-[17px] leading-[1.7] font-normal">
          <Markdown components={MARKDOWN_COMPONENTS}>{report}</Markdown>
        </div>
      ) : (
        <p className="text-muted text-sm">
          리포트 생성에 실패했습니다. 잠시 후 다시 분석을 시도해주세요.
        </p>
      )}
    </section>
  );
}
