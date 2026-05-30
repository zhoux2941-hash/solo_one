import { useEffect, useRef } from 'react';
import { X, Flame, Download } from 'lucide-react';
import {
  drawPlastronOutline,
  drawCarapaceOutline,
  drawPitMark,
  drawCrackBranch,
  drawInscription,
  drawBurnMark,
} from '@/utils/shellRenderer';
import type { OracleExample } from '@/types';
import { useDivinationStore } from '@/stores/divinationStore';

interface ExampleDetailModalProps {
  example: OracleExample | null;
  onClose: () => void;
}

export default function ExampleDetailModal({ example, onClose }: ExampleDetailModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { loadExample } = useDivinationStore();

  useEffect(() => {
    if (!example) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1208';
    ctx.fillRect(0, 0, 500, 400);

    const centerX = 250;
    const centerY = 200;

    if (example.shellType === 'plastron') {
      drawPlastronOutline(ctx, centerX, centerY, 400, 320);
    } else {
      drawCarapaceOutline(ctx, centerX, centerY, 370, 350);
    }

    const intensity = example.temperature / 1200;
    for (const cp of example.crackData || []) {
      drawBurnMark(ctx, cp.x, cp.y, intensity);
      drawPitMark(ctx, cp.x, cp.y, example.pitShape);
      for (const branch of cp.branches) {
        drawCrackBranch(ctx, cp.x, cp.y, branch, 1);
      }
    }

    for (const ins of example.inscriptions || []) {
      drawInscription(ctx, ins);
    }
  }, [example]);

  if (!example) return null;

  const handleLoad = () => {
    loadExample(example);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full mx-4 rounded-xl p-6"
        style={{
          background: 'rgba(26, 18, 8, 0.95)',
          border: '2px solid rgba(139, 105, 20, 0.6)',
          boxShadow: '0 0 40px rgba(139, 105, 20, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded transition-colors"
          style={{ color: '#d4a843' }}
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold" style={{ color: '#d4a843' }}>
            {example.name}
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: 'rgba(199, 62, 58, 0.3)', color: '#e8a8a0' }}
          >
            {example.period}
          </span>
        </div>

        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={500}
            height={400}
            className="rounded-lg"
            style={{ maxWidth: '100%' }}
          />
        </div>

        <p className="text-sm mb-4" style={{ color: '#b8a070' }}>
          {example.description}
        </p>

        <div className="flex items-center gap-4 mb-5 text-sm" style={{ color: '#8b7355' }}>
          <span>龟甲部位：{example.shellType === 'plastron' ? '腹甲' : '背甲'}</span>
          <span>·</span>
          <span>凿坑形状：{example.pitShape === 'circle' ? '圆形' : '枣核形'}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Flame size={14} style={{ color: '#c73e3a' }} />
            {example.temperature}℃
          </span>
          <span>·</span>
          <span>纵/横比：{example.anisotropyRatio.toFixed(1)}</span>
        </div>

        <button
          onClick={handleLoad}
          className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
          style={{
            background: 'linear-gradient(180deg, #8b6914, #6b4f0e)',
            color: '#f5e6c8',
            border: '1px solid #a07d20',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #a07d20, #8b6914)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #8b6914, #6b4f0e)';
          }}
        >
          <Download size={18} />
          加载此示例到工作台
        </button>
      </div>
    </div>
  );
}
