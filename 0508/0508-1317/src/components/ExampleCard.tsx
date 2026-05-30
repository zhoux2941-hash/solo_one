import { useEffect, useRef } from 'react';
import { drawPlastronOutline, drawCarapaceOutline } from '@/utils/shellRenderer';
import type { OracleExample } from '@/types';
import { Flame } from 'lucide-react';

interface ExampleCardProps {
  example: OracleExample;
  onClick: () => void;
}

export default function ExampleCard({ example, onClick }: ExampleCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1208';
    ctx.fillRect(0, 0, 120, 100);

    const centerX = 60;
    const centerY = 50;

    if (example.shellType === 'plastron') {
      drawPlastronOutline(ctx, centerX, centerY, 90, 72);
    } else {
      drawCarapaceOutline(ctx, centerX, centerY, 85, 78);
    }

    if (example.crackData?.length > 0) {
      ctx.strokeStyle = '#2a1a0a';
      ctx.lineWidth = 0.8;
      for (const cp of example.crackData.slice(0, 4)) {
        const scale = example.shellType === 'plastron' ? 0.22 : 0.24;
        const offsetX = example.shellType === 'plastron' ? 10.5 : 17.5;
        const offsetY = example.shellType === 'plastron' ? 14 : 11;
        for (const branch of cp.branches) {
          ctx.beginPath();
          ctx.moveTo(cp.x * scale + offsetX, cp.y * scale + offsetY);
          const endX = (cp.x * scale + offsetX) + Math.cos(branch.angle) * (branch.length * scale);
          const endY = (cp.y * scale + offsetY) + Math.sin(branch.angle) * (branch.length * scale);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
    }
  }, [example]);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
      style={{
        background: 'rgba(26, 18, 8, 0.6)',
        border: '1px solid rgba(139, 105, 20, 0.4)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(139, 105, 20, 0.9)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(139, 105, 20, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(139, 105, 20, 0.4)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <canvas ref={canvasRef} width={120} height={100} className="w-full h-24 object-cover" />

      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-bold" style={{ color: '#d4a843' }}>
            {example.name}
          </h4>
        </div>

        <span
          className="inline-block text-xs px-2 py-0.5 rounded mb-2"
          style={{ background: 'rgba(199, 62, 58, 0.3)', color: '#e8a8a0' }}
        >
          {example.period}
        </span>

        <p
          className="text-xs line-clamp-2 mb-2"
          style={{ color: '#8b7355' }}
        >
          {example.description}
        </p>

        <div className="flex items-center gap-2 text-xs" style={{ color: '#8b7355' }}>
          <Flame size={12} style={{ color: '#d4a843' }} />
          <span>{example.temperature}℃</span>
          <span>·</span>
          <span>{example.pitShape === 'circle' ? '圆形' : '枣核形'}</span>
          <span>·</span>
          <span>{example.anisotropyRatio.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
