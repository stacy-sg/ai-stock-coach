import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type Block = { type: "list"; items: string[] } | { type: "paragraph"; text: string };

function toBlocks(report: string): Block[] {
  const blocks: Block[] = [];
  for (const rawLine of report.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const isBullet = line.startsWith("* ") || line.startsWith("- ");
    const text = isBullet ? line.slice(2).trim() : line;

    const last = blocks[blocks.length - 1];
    if (isBullet && last?.type === "list") {
      last.items.push(text);
    } else if (isBullet) {
      blocks.push({ type: "list", items: [text] });
    } else {
      blocks.push({ type: "paragraph", text });
    }
  }
  return blocks;
}

// Renders **bold** spans from the LLM's markdown-ish output without pulling
// in a full markdown dependency for one formatting case.
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function AnalysisReport({ report }: { report: string | null }) {
  return (
    <section className="card flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="text-brand size-4" />
        <h2 className="text-sm font-semibold">AI 리포트</h2>
      </div>

      {report ? (
        <div className="flex flex-col gap-3 text-sm leading-relaxed">
          {toBlocks(report).map((block, i) =>
            block.type === "list" ? (
              <ul key={i} className="flex flex-col gap-2">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="bg-brand mt-2 size-1.5 shrink-0 rounded-full" />
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p key={i}>{renderInline(block.text)}</p>
            )
          )}
        </div>
      ) : (
        <p className="text-muted text-sm">
          리포트 생성에 실패했습니다. 잠시 후 다시 분석을 시도해주세요.
        </p>
      )}
    </section>
  );
}
