import { type BracketResult } from '@/utils/bracketMatcher';
import { CheckCircle2, XCircle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultDisplayProps {
  result: BracketResult | null;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  if (!result) return null;

  return (
    <div
      className={cn(
        'rounded-lg border p-5 transition-all duration-500',
        'animate-in fade-in slide-in-from-bottom-2',
        result.valid
          ? 'bg-emerald-950/30 border-emerald-500/30'
          : 'bg-orange-950/30 border-orange-500/30'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        {result.valid ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold text-base">
              匹配合法
            </span>
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-semibold text-base">
              不匹配
            </span>
          </>
        )}
      </div>

      {result.valid ? (
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-zinc-400" />
          <span className="text-zinc-400 text-sm">最大嵌套深度</span>
          <span className="text-2xl font-bold text-emerald-300 font-mono ml-auto">
            {result.maxDepth}
          </span>
        </div>
      ) : (
        <div className="text-orange-300/80 text-sm font-mono leading-relaxed">
          {result.error}
        </div>
      )}

      {result.valid && result.maxDepth > 0 && (
        <div className="mt-4 flex items-end gap-0.5 h-10">
          {Array.from({ length: result.maxDepth }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-300"
              style={{
                height: `${((i + 1) / result.maxDepth) * 100}%`,
                backgroundColor: `rgba(52, 211, 153, ${0.3 + (i / result.maxDepth) * 0.7})`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
