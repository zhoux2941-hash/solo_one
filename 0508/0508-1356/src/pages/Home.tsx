import { useBracketMatch } from '@/hooks/useBracketMatch';
import BracketInput from '@/components/BracketInput';
import ResultDisplay from '@/components/ResultDisplay';
import ExampleButtons from '@/components/ExampleButtons';
import { Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const { input, setInput, result, calculate, setExample, reset } = useBracketMatch();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      calculate();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-500 text-xs font-mono tracking-wider uppercase">
              Bracket Analyzer
            </span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
            括号匹配深度计算
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            验证括号字符串合法性，计算最大嵌套深度
          </p>
        </div>

        <div
          className={cn(
            'bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/60 rounded-xl p-6',
            'shadow-2xl shadow-black/20'
          )}
        >
          <div className="space-y-4">
            <BracketInput value={input} onChange={setInput} />

            <div onKeyDown={handleKeyDown}>
              <ExampleButtons onSelect={setExample} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={calculate}
                disabled={!input.trim()}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm',
                  'bg-emerald-600 text-white',
                  'hover:bg-emerald-500 active:bg-emerald-700',
                  'disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                  'shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/40'
                )}
              >
                <Play className="w-4 h-4" />
                计算
              </button>
              <button
                onClick={reset}
                className={cn(
                  'flex items-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm',
                  'bg-zinc-800 text-zinc-400 border border-zinc-700/50',
                  'hover:bg-zinc-700 hover:text-zinc-300',
                  'transition-all duration-200'
                )}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置
              </button>
            </div>

            <ResultDisplay result={result} />
          </div>
        </div>

        <div className="text-center mt-6 text-zinc-600 text-xs font-mono">
          按 Enter 快速计算 &middot; 空格自动忽略 &middot; 支持 {'{ } [ ] ( )'} 混合
        </div>
      </div>
    </div>
  );
}
