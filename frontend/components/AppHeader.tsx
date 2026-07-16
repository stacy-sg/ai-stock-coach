import { Briefcase, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="site-header">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="bg-brand/10 text-brand inline-flex size-7 items-center justify-center rounded-lg">
            <Sparkles className="size-3.5" />
          </span>
          <span className="font-bold tracking-tight">AI Stock Coach</span>
        </Link>
        <Link href="/holdings" className="link-back">
          <Briefcase className="size-3.5" />
          보유 종목
        </Link>
      </div>
    </header>
  );
}
