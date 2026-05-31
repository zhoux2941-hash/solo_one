import { useFractalStore } from '../store/fractalStore';
import { subscribeCacheSize, getCacheSizeSnapshot } from '../utils/tileCache';
import { useSyncExternalStore } from 'react';

function useCacheSize() {
  return useSyncExternalStore(subscribeCacheSize, getCacheSizeSnapshot);
}

export function InfoPanel() {
  const { viewState, renderProgress } = useFractalStore();
  const { centerX, centerY, zoom, maxIterations } = viewState;
  const { percentage, isRendering, totalBlocks, completedBlocks } = renderProgress;
  const cacheSize = useCacheSize();

  const formatZoom = (z: number): string => {
    if (z >= 1e9) return `${(z / 1e9).toFixed(2)}e9`;
    if (z >= 1e6) return `${(z / 1e6).toFixed(2)}e6`;
    if (z >= 1e3) return `${(z / 1e3).toFixed(2)}e3`;
    return z.toFixed(2);
  };

  return (
    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md rounded-lg px-4 py-3 border border-purple-500/30 text-white font-mono text-xs shadow-xl">
      <div className="space-y-1">
        <div className="flex justify-between gap-8">
          <span className="text-gray-400">实部 (Re):</span>
          <span className="text-cyan-400">{centerX.toFixed(6)}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-gray-400">虚部 (Im):</span>
          <span className="text-cyan-400">{centerY.toFixed(6)}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-gray-400">缩放级别:</span>
          <span className="text-purple-400">{formatZoom(zoom)}×</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-gray-400">迭代次数:</span>
          <span className="text-yellow-400">{maxIterations}</span>
        </div>
        <div className="flex justify-between gap-8 pt-1 border-t border-gray-700">
          <span className="text-gray-400">缓存瓦片:</span>
          <span className="text-emerald-400">{cacheSize}</span>
        </div>
        {isRendering && (
          <div className="flex justify-between gap-8">
            <span className="text-gray-400">渲染进度:</span>
            <span className="text-green-400 animate-pulse">{percentage}%</span>
          </div>
        )}
        {!isRendering && percentage >= 100 && totalBlocks > 0 && (
          <div className="flex justify-between gap-8">
            <span className="text-gray-400">渲染完成:</span>
            <span className="text-green-400">100%</span>
          </div>
        )}
      </div>
    </div>
  );
}
