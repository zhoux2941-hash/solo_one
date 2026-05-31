import InputPanel from "@/components/InputPanel";
import ResultPanel from "@/components/ResultPanel";

export default function Home() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1400px] mx-auto">
        <div className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-gold/40" />
            文本输入
          </h2>
          <InputPanel />
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-gold/40" />
            分析结果
          </h2>
          <ResultPanel />
        </div>
      </div>

      <footer className="mt-16 pb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="w-12 h-px bg-ink-700/30" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-500/50">
            Readability Formulas
          </span>
          <span className="w-12 h-px bg-ink-700/30" />
        </div>
        <p className="text-xs text-ink-500/40 font-body max-w-lg mx-auto leading-relaxed">
          Flesch Reading Ease · Flesch-Kincaid Grade Level · Gunning Fog Index · SMOG Index
        </p>
      </footer>
    </main>
  );
}
