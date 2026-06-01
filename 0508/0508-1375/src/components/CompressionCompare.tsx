import { useHuffmanStore } from '@/hooks/useHuffmanStore';
import { ArrowDownUp } from 'lucide-react';

export default function CompressionCompare() {
  const compression = useHuffmanStore(s => s.compression);

  if (!compression) return null;

  const { originalBits, huffmanBits, compressionRatio } = compression;
  const maxBits = Math.max(originalBits, huffmanBits);
  const originalPct = maxBits > 0 ? (originalBits / maxBits) * 100 : 0;
  const huffmanPct = maxBits > 0 ? (huffmanBits / maxBits) * 100 : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ArrowDownUp size={18} className="text-amber-400" />
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">压缩对比</h2>
      </div>
      <div className="space-y-4 bg-[#0a1628] rounded-xl p-4 border border-zinc-800/50">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-zinc-400">原始 8位编码</span>
            <span className="font-mono text-xs text-zinc-300">{originalBits} bits</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${originalPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-zinc-400">Huffman编码</span>
            <span className="font-mono text-xs text-emerald-400">{huffmanBits} bits</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${huffmanPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 border-t border-zinc-800/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {compressionRatio.toFixed(1)}%
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">压缩率</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {originalBits - huffmanBits}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">节省 bits</div>
          </div>
        </div>
      </div>
    </div>
  );
}
