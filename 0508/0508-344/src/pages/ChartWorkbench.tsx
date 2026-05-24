import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TopNavbar } from '../components/TopNavbar';
import { LayerPanel } from '../components/LayerPanel';
import { CollisionPanel } from '../components/CollisionPanel';
import { ChartCanvas, ChartCanvasRef } from '../components/ChartCanvas';
import { ExportDialog } from '../components/ExportDialog';
import { useChartStore } from '../store/useChartStore';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type Konva from 'konva';

export const ChartWorkbench: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartCanvasRef = useRef<ChartCanvasRef>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 600 });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { stageScale, setStageTransform } = useChartStore();

  const getStage = useCallback((): Konva.Stage | null => {
    return chartCanvasRef.current?.getStage() || null;
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (chartContainerRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleZoomIn = () => {
    setStageTransform(Math.min(3, stageScale * 1.2), 0, 0);
  };

  const handleZoomOut = () => {
    setStageTransform(Math.max(0.5, stageScale / 1.2), 0, 0);
  };

  const handleResetView = () => {
    setStageTransform(1, 0, 0);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <TopNavbar onExport={() => setShowExportDialog(true)} />

      <div className="flex-1 flex overflow-hidden">
        <LayerPanel />

        <div className="flex-1 flex flex-col relative">
          <div
            ref={chartContainerRef}
            id="chart-container"
            className="flex-1 overflow-hidden relative"
          >
            {canvasSize.width > 0 && canvasSize.height > 0 && (
              <ChartCanvas ref={chartCanvasRef} width={canvasSize.width} height={canvasSize.height} />
            )}
          </div>

          <div className="absolute bottom-4 left-4 flex gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-slate-800/90 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
              title="放大"
            >
              <ZoomIn size={18} className="text-slate-300" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-slate-800/90 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
              title="缩小"
            >
              <ZoomOut size={18} className="text-slate-300" />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 bg-slate-800/90 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
              title="重置视图"
            >
              <Maximize2 size={18} className="text-slate-300" />
            </button>
            <div className="px-3 py-2 bg-slate-800/90 border border-slate-600 rounded-lg text-xs text-slate-400 font-mono">
              {Math.round(stageScale * 100)}%
            </div>
          </div>

          <div className="absolute bottom-4 right-4 px-3 py-2 bg-slate-800/90 border border-slate-600 rounded-lg text-xs text-slate-400">
            <span className="text-slate-500">提示：</span>
            滚轮缩放 · 拖拽平移 · 点击元素选中
          </div>
        </div>

        <CollisionPanel />
      </div>

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        getStage={getStage}
      />
    </div>
  );
};
