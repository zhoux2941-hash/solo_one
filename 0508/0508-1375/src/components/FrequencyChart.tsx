import { useHuffmanStore } from '@/hooks/useHuffmanStore';
import { BarChart3, Plus, Minus, RotateCcw } from 'lucide-react';

export default function FrequencyChart() {
  const frequencyMap = useHuffmanStore(s => s.frequencyMap);
  const adjustWeight = useHuffmanStore(s => s.adjustWeight);
  const resetWeights = useHuffmanStore(s => s.resetWeights);
  const inputText = useHuffmanStore(s => s.inputText);

  const entries = Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return null;

  const maxFreq = Math.max(...entries.map(([, f]) => f));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={18} className="text-amber-400" />
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">频率 / 权重</h2>
        {inputText && (
          <button
            onClick={resetWeights}
            className="ml-auto p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-all"
            title="重置为原始频率"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
        {entries.map(([char, freq]) => {
          const pct = maxFreq > 0 ? (freq / maxFreq) * 100 : 0;
          const label = char === ' ' ? '␣' : char;
          return (
            <div key={char} className="flex items-center gap-2">
              <span className="w-5 text-center font-mono text-sm font-bold text-emerald-400">
                {label}
              </span>
              <div className="flex-1 h-5 bg-[#0a1628] rounded-full overflow-hidden border border-zinc-800/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustWeight(char, -1)}
                  disabled={freq <= 1}
                  className="p-1 rounded-md bg-zinc-800/50 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="减少权重"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center font-mono text-xs text-zinc-300">{freq}</span>
                <button
                  onClick={() => adjustWeight(char, 1)}
                  className="p-1 rounded-md bg-zinc-800/50 hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400 transition-all"
                  title="增加权重"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-zinc-600">
        点击 ± 按钮调整字符权重，实时重建 Huffman 树和编码
      </p>
    </div>
  );
}
