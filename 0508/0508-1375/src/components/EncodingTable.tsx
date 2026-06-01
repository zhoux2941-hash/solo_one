import { useHuffmanStore } from '@/hooks/useHuffmanStore';
import { Table } from 'lucide-react';

export default function EncodingTable() {
  const codes = useHuffmanStore(s => s.codes);

  if (codes.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Table size={18} className="text-amber-400" />
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">编码表</h2>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-800/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0a1628]">
              <th className="px-3 py-2 text-left text-xs text-zinc-500 font-medium">字符</th>
              <th className="px-3 py-2 text-left text-xs text-zinc-500 font-medium">频率</th>
              <th className="px-3 py-2 text-left text-xs text-zinc-500 font-medium">编码</th>
              <th className="px-3 py-2 text-left text-xs text-zinc-500 font-medium">码长</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((entry, i) => {
              const charLabel = entry.char === ' ' ? '␣' : entry.char;
              return (
                <tr
                  key={entry.char}
                  className={`border-t border-zinc-800/30 ${i % 2 === 0 ? 'bg-[#0d1b2a]/50' : 'bg-[#0a1628]/50'} hover:bg-amber-500/5 transition-colors`}
                >
                  <td className="px-3 py-2 font-mono font-bold text-emerald-400">{charLabel}</td>
                  <td className="px-3 py-2 font-mono text-zinc-400">{entry.freq}</td>
                  <td className="px-3 py-2 font-mono text-amber-400 tracking-wider">{entry.code}</td>
                  <td className="px-3 py-2 font-mono text-zinc-500">{entry.codeLength}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
