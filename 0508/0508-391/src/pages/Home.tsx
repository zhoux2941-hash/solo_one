import { useState, useEffect } from 'react';
import { StarMapCanvas } from '../components/StarMapCanvas';
import { ControlPanel } from '../components/ControlPanel';
import { StarInfoPopup } from '../components/StarInfoPopup';
import { useDataLoading } from '../hooks/useDataLoading';
import { useStarMapStore } from '../store/useStarMapStore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  useDataLoading();
  const { loading, error } = useStarMapStore();
  const [dimensions, setDimensions] = useState({ width: 900, height: 900 });

  useEffect(() => {
    const updateDimensions = () => {
      const availableWidth = Math.max(600, window.innerWidth - 340);
      const availableHeight = Math.max(600, window.innerHeight - 40);
      const size = Math.min(availableWidth, availableHeight);
      setDimensions({ width: size, height: size });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <ControlPanel />

      <div className="flex-1 flex items-center justify-center p-5 relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center z-50">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
              <p className="text-amber-200/60">正在加载恒星数据...</p>
              <p className="text-amber-200/40 text-sm mt-1">基于《仪象考成》星表</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center z-50">
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠</span>
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">数据加载失败</h3>
              <p className="text-amber-200/60">{error}</p>
              <p className="text-amber-200/40 text-sm mt-4">
                请确保后端服务已启动并运行在 http://localhost:3001
              </p>
            </div>
          </div>
        )}

        <StarMapCanvas width={dimensions.width} height={dimensions.height} />
      </div>

      <StarInfoPopup />
    </div>
  );
}
