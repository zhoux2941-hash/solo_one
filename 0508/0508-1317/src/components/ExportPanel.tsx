import { useState } from 'react';
import { Download, Image, FileText, Loader2 } from 'lucide-react';
import { useDivinationStore } from '@/stores/divinationStore';
import { Inscription } from '@/types';

interface ExportPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export default function ExportPanel({ canvasRef }: ExportPanelProps) {
  const { shellType, pitShape, temperature, anisotropyRatio, inscriptions, hasCracked } = useDivinationStore();
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);

  const handleExportPng = () => {
    if (!canvasRef.current || !hasCracked) return;

    setExporting('png');

    setTimeout(() => {
      const canvas = canvasRef.current!;
      const link = document.createElement('a');
      link.download = `oracle-shell-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setExporting(null);
    }, 100);
  };

  const handleExportPdf = async () => {
    if (!canvasRef.current || !hasCracked) return;

    setExporting('pdf');

    try {
      const imageDataUrl = canvasRef.current.toDataURL('image/png');

      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shellType,
          pitShape,
          temperature,
          anisotropyRatio,
          inscriptions: inscriptions.map((i: Inscription) => ({
            x: i.x,
            y: i.y,
            text: i.text,
            fontSize: i.fontSize,
            rotation: i.rotation,
          })),
          imageDataUrl,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `oracle-report-${Date.now()}.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{
        background: 'rgba(26, 18, 8, 0.85)',
        border: '1px solid rgba(139, 105, 20, 0.4)',
      }}
    >
      <Download size={18} style={{ color: '#d4a843' }} />

      <span className="text-sm font-medium mr-2" style={{ color: '#d4a843' }}>
        导出：
      </span>

      <button
        onClick={handleExportPng}
        disabled={!hasCracked || exporting !== null}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        style={{
          background: hasCracked && !exporting
            ? 'linear-gradient(180deg, rgba(139, 105, 20, 0.4), rgba(107, 79, 14, 0.4))'
            : 'rgba(100, 80, 50, 0.2)',
          border: '1px solid rgba(139, 105, 20, 0.5)',
          color: '#f5e6c8',
        }}
      >
        {exporting === 'png' ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
        {exporting === 'png' ? '导出中...' : '卜甲图像 (PNG)'}
      </button>

      <button
        onClick={handleExportPdf}
        disabled={!hasCracked || exporting !== null}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        style={{
          background: hasCracked && !exporting
            ? 'linear-gradient(180deg, rgba(139, 105, 20, 0.6), rgba(107, 79, 14, 0.6))'
            : 'rgba(100, 80, 50, 0.2)',
          border: '1px solid rgba(139, 105, 20, 0.6)',
          color: '#f5e6c8',
        }}
      >
        {exporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
        {exporting === 'pdf' ? '生成中...' : '解读报告 (PDF)'}
      </button>
    </div>
  );
}
