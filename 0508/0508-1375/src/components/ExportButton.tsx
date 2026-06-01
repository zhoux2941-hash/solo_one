import { useHuffmanStore } from '@/hooks/useHuffmanStore';
import { exportCodesAsJSON } from '@/utils/huffman';
import { Download } from 'lucide-react';

export default function ExportButton() {
  const codes = useHuffmanStore(s => s.codes);

  const handleExport = () => {
    if (codes.length === 0) return;
    const json = exportCodesAsJSON(codes);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'huffman-codes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={codes.length === 0}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10"
    >
      <Download size={16} />
      <span className="text-sm font-medium">导出编码表 JSON</span>
    </button>
  );
}
