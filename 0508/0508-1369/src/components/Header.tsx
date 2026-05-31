import { BookOpen } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-ink-700/50 bg-ink-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-ink-50 tracking-wide">
              Readability Analyzer
            </h1>
            <p className="text-xs text-ink-300 font-body">
              英文文本可读性分析工具
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-ink-400 font-mono">
          <span className="px-2 py-1 rounded bg-ink-800 border border-ink-700/50">
            Flesch
          </span>
          <span className="px-2 py-1 rounded bg-ink-800 border border-ink-700/50">
            Kincaid
          </span>
          <span className="px-2 py-1 rounded bg-ink-800 border border-ink-700/50">
            Fog
          </span>
          <span className="px-2 py-1 rounded bg-ink-800 border border-ink-700/50">
            SMOG
          </span>
        </div>
      </div>
    </header>
  );
}
