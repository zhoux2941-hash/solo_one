import React, { useRef, useEffect } from 'react';
import { WinRateData } from '../../shared/types';

interface WinRateChartProps {
  winRateHistory: WinRateData[];
}

export const WinRateChart: React.FC<WinRateChartProps> = ({ winRateHistory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasWidth = 300;
  const canvasHeight = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartWidth = canvasWidth - padding.left - padding.right;
  const chartHeight = canvasHeight - padding.top - padding.bottom;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#FFF8E1';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = '#D7CCC8';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvasWidth - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#6D4C41';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${100 - i * 20}%`, padding.left - 5, y + 3);
    }

    if (winRateHistory.length < 2) {
      ctx.fillStyle = '#8D6E63';
      ctx.font = '12px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无足够数据', canvasWidth / 2, canvasHeight / 2);
      return;
    }

    const maxMoves = Math.max(winRateHistory.length, 10);
    
    const getX = (index: number) => padding.left + (index / (maxMoves - 1)) * chartWidth;
    const getY = (winRate: number) => padding.top + (1 - winRate / 100) * chartHeight;

    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight / 2);
    ctx.lineTo(canvasWidth - padding.right, padding.top + chartHeight / 2);
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(winRateHistory[0].blackWinRate));
    
    for (let i = 1; i < winRateHistory.length; i++) {
      const x = getX(i);
      const y = getY(winRateHistory[i].blackWinRate);
      ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.lineTo(getX(winRateHistory.length - 1), getY(50));
    ctx.lineTo(getX(0), getY(50));
    ctx.closePath();
    ctx.fillStyle = 'rgba(33, 33, 33, 0.1)';
    ctx.fill();

    if (winRateHistory.length > 0) {
      const lastPoint = winRateHistory[winRateHistory.length - 1];
      ctx.beginPath();
      ctx.arc(
        getX(winRateHistory.length - 1),
        getY(lastPoint.blackWinRate),
        4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = '#212121';
      ctx.fill();
    }

    ctx.fillStyle = '#6D4C41';
    ctx.font = '10px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('手数', canvasWidth / 2, canvasHeight - 5);
  }, [winRateHistory]);

  return (
    <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl p-4 shadow-lg border border-amber-200">
      <h3 className="text-sm font-bold text-amber-900 mb-3 text-center" style={{ fontFamily: '"Ma Shan Zheng", serif' }}>
        胜率走势图
      </h3>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="rounded"
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="flex justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
          <span className="text-amber-800">黑方</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-orange-500" style={{ borderStyle: 'dashed' }}></div>
          <span className="text-amber-800">均势</span>
        </div>
      </div>
    </div>
  );
};
