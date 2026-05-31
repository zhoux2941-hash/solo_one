import { useState, useCallback, useEffect } from 'react';
import { RotateCcw, RefreshCw, Square, ZoomIn, ZoomOut } from 'lucide-react';
import { useFractalStore } from '../store/fractalStore';
import { paletteOptions } from '../utils/palettes';
import { PaletteName } from '../types/fractal';

interface ControlPanelProps {
  onRender: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function ControlPanel({ onRender, onStop, onReset }: ControlPanelProps) {
  const { viewState, setViewState, renderProgress } = useFractalStore();
  const { centerX, centerY, zoom, maxIterations, palette } = viewState;
  const { isRendering } = renderProgress;

  const [localCenterX, setLocalCenterX] = useState(centerX.toString());
  const [localCenterY, setLocalCenterY] = useState(centerY.toString());
  const [localZoom, setLocalZoom] = useState(zoom.toString());

  useEffect(() => {
    setLocalCenterX(centerX.toString());
    setLocalCenterY(centerY.toString());
    setLocalZoom(zoom.toString());
  }, [centerX, centerY, zoom]);

  const logZoom = Math.log10(zoom);
  const minLogZoom = 0;
  const maxLogZoom = 12;

  const handleCenterXChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalCenterX(e.target.value);
    },
    []
  );

  const handleCenterYChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalCenterY(e.target.value);
    },
    []
  );

  const handleZoomInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalZoom(e.target.value);
    },
    []
  );

  const handleCenterXBlur = useCallback(() => {
    const val = parseFloat(localCenterX);
    if (!isNaN(val)) {
      setViewState({ centerX: val });
    } else {
      setLocalCenterX(centerX.toString());
    }
  }, [localCenterX, centerX, setViewState]);

  const handleCenterYBlur = useCallback(() => {
    const val = parseFloat(localCenterY);
    if (!isNaN(val)) {
      setViewState({ centerY: val });
    } else {
      setLocalCenterY(centerY.toString());
    }
  }, [localCenterY, centerY, setViewState]);

  const handleZoomBlur = useCallback(() => {
    const val = parseFloat(localZoom);
    if (!isNaN(val) && val >= 1 && val <= 1e12) {
      setViewState({ zoom: val });
    } else {
      setLocalZoom(zoom.toString());
    }
  }, [localZoom, zoom, setViewState]);

  const handleZoomSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const logVal = parseFloat(e.target.value);
      const newZoom = Math.pow(10, logVal);
      setViewState({ zoom: newZoom });
    },
    [setViewState]
  );

  const handleIterationsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setViewState({ maxIterations: parseInt(e.target.value) });
    },
    [setViewState]
  );

  const handlePaletteChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setViewState({ palette: e.target.value as PaletteName });
    },
    [setViewState]
  );

  const handleZoomIn = useCallback(() => {
    setViewState({ zoom: Math.min(zoom * 2, 1e12) });
  }, [zoom, setViewState]);

  const handleZoomOut = useCallback(() => {
    setViewState({ zoom: Math.max(zoom / 2, 1) });
  }, [zoom, setViewState]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      }
    },
    []
  );

  return (
    <div className="w-72 bg-gray-900/80 backdrop-blur-xl border-r border-purple-500/20 flex flex-col h-full">
      <div className="p-4 border-b border-purple-500/20">
        <h1 className="text-xl font-bold text-white tracking-tight">
          <span className="text-purple-400">曼德尔布罗特</span>集
        </h1>
        <p className="text-xs text-gray-500 mt-1">分形探索器</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">中心坐标</label>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500 block mb-1">实部 (Re)</span>
              <input
                type="text"
                value={localCenterX}
                onChange={handleCenterXChange}
                onBlur={handleCenterXBlur}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-cyan-400 font-mono text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                spellCheck={false}
              />
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">虚部 (Im)</span>
              <input
                type="text"
                value={localCenterY}
                onChange={handleCenterYChange}
                onBlur={handleCenterYBlur}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-cyan-400 font-mono text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">缩放级别</label>
            <div className="flex gap-1">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 1e12}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                title="放大"
              >
                <ZoomIn className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <input
            type="text"
            value={localZoom}
            onChange={handleZoomInputChange}
            onBlur={handleZoomBlur}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-purple-400 font-mono text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            spellCheck={false}
          />
          <input
            type="range"
            min={minLogZoom}
            max={maxLogZoom}
            step={0.01}
            value={logZoom}
            onChange={handleZoomSliderChange}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1×</span>
            <span>1e12×</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">迭代次数</label>
            <span className="text-yellow-400 font-mono text-sm">{maxIterations}</span>
          </div>
          <input
            type="range"
            min={10}
            max={256}
            value={maxIterations}
            onChange={handleIterationsChange}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>10</span>
            <span>256</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">调色板</label>
          <select
            value={palette}
            onChange={handlePaletteChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer"
          >
            {paletteOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 border-t border-purple-500/20 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onRender}
            disabled={isRendering}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-all shadow-lg shadow-purple-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${isRendering ? 'animate-spin' : ''}`} />
            渲染
          </button>
          <button
            onClick={onStop}
            disabled={!isRendering}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-red-900/50 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors border border-gray-700"
          >
            <Square className="w-4 h-4" />
            停止
          </button>
        </div>
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-md transition-colors border border-gray-700"
        >
          <RotateCcw className="w-4 h-4" />
          重置视图
        </button>
      </div>
    </div>
  );
}
