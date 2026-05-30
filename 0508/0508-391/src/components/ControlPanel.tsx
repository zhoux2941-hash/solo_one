import { Download, Play, Pause, RotateCcw, Settings, Grid, Link2, Tag, Maximize2 } from 'lucide-react';
import { useStarMapStore } from '../store/useStarMapStore';
import { downloadSVG } from '../utils/svgExport';
import { PROJECTION_INFO, type ProjectionType } from '../../shared/types';

export const ControlPanel = () => {
  const {
    stars,
    constellations,
    connections,
    projection,
    autoScale,
    showConstellationLines,
    showGrid,
    showStarLabels,
    plotterMode,
    setProjection,
    setProjectionType,
    setAutoScale,
    setShowConstellationLines,
    setShowGrid,
    setShowStarLabels,
    startPlotterMode,
    stopPlotterMode,
    togglePlotterPause,
    resetPlotter,
    setPlotterSpeed,
  } = useStarMapStore();

  const handleExportSVG = () => {
    downloadSVG(stars, constellations, connections, projection);
  };

  const projectionTypes: Array<{ value: ProjectionType; label: string }> = [
    { value: 'stereographic', label: PROJECTION_INFO.stereographic.name },
    { value: 'equidistant', label: PROJECTION_INFO.equidistant.name },
    { value: 'mercator', label: PROJECTION_INFO.mercator.name },
  ];

  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur-sm border-r border-amber-900/30 p-6 flex flex-col gap-6 h-full overflow-y-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-amber-100 font-serif mb-1">仪象考成</h1>
        <p className="text-xs text-amber-200/60">古代星图绘制工具</p>
      </div>

      <div className="border-t border-amber-900/30 pt-4">
        <h2 className="text-sm font-semibold text-amber-200 mb-3 flex items-center gap-2">
          <Settings size={14} />
          投影类型
        </h2>
        <div className="space-y-2">
          {projectionTypes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setProjectionType(value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                projection.type === value
                  ? 'bg-amber-700/40 text-amber-100 border border-amber-600/50'
                  : 'bg-slate-800/50 text-amber-200/70 border border-transparent hover:bg-slate-800'
              }`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs opacity-70 mt-1">
                {PROJECTION_INFO[value].description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-amber-900/30 pt-4">
        <h2 className="text-sm font-semibold text-amber-200 mb-3">绘图参数</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group mb-2">
            <input
              type="checkbox"
              checked={autoScale}
              onChange={(e) => setAutoScale(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            <Maximize2 size={14} className="text-amber-200/60" />
            <span className="text-sm text-amber-200/80 group-hover:text-amber-100">
              自适应缩放
            </span>
          </label>

          <div className={autoScale ? 'opacity-50 pointer-events-none' : ''}>
            <label className="block text-xs text-amber-200/60 mb-1">
              绘图比例: {projection.scale.toFixed(0)}
            </label>
            <input
              type="range"
              min="50"
              max="400"
              value={projection.scale}
              onChange={(e) => setProjection({ scale: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs text-amber-200/60 mb-1">
              中心赤经: {projection.centerRa.toFixed(1)}h
            </label>
            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={projection.centerRa}
              onChange={(e) => setProjection({ centerRa: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs text-amber-200/60 mb-1">
              中心赤纬: {projection.centerDec.toFixed(0)}°
            </label>
            <input
              type="range"
              min="-90"
              max="90"
              value={projection.centerDec}
              onChange={(e) => setProjection({ centerDec: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs text-amber-200/60 mb-1">
              旋转角度: {projection.rotation.toFixed(0)}°
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              value={projection.rotation}
              onChange={(e) => setProjection({ rotation: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-amber-900/30 pt-4">
        <h2 className="text-sm font-semibold text-amber-200 mb-3">显示选项</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            <Grid size={14} className="text-amber-200/60" />
            <span className="text-sm text-amber-200/80 group-hover:text-amber-100">
              显示网格
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={showConstellationLines}
              onChange={(e) => setShowConstellationLines(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            <Link2 size={14} className="text-amber-200/60" />
            <span className="text-sm text-amber-200/80 group-hover:text-amber-100">
              星官连线
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={showStarLabels}
              onChange={(e) => setShowStarLabels(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            <Tag size={14} className="text-amber-200/60" />
            <span className="text-sm text-amber-200/80 group-hover:text-amber-100">
              星名标注
            </span>
          </label>
        </div>
      </div>

      <div className="border-t border-amber-900/30 pt-4">
        <h2 className="text-sm font-semibold text-amber-200 mb-3">绘图仪模式</h2>
        
        {!plotterMode.active ? (
          <button
            onClick={startPlotterMode}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-amber-100 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Play size={16} />
            开始绘制动画
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex justify-between text-xs text-amber-200/60 mb-2">
                <span>绘制进度</span>
                <span>{(plotterMode.progress * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-red-600 transition-all duration-100"
                  style={{ width: `${plotterMode.progress * 100}%` }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-amber-200/60 mb-1">
                绘制速度: {plotterMode.speed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={plotterMode.speed}
                onChange={(e) => setPlotterSpeed(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={togglePlotterPause}
                className="flex-1 py-2 px-4 bg-amber-700/40 hover:bg-amber-700/60 text-amber-100 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {plotterMode.paused ? <Play size={16} /> : <Pause size={16} />}
                {plotterMode.paused ? '继续' : '暂停'}
              </button>
              <button
                onClick={resetPlotter}
                className="py-2 px-4 bg-slate-700 hover:bg-slate-600 text-amber-100 rounded-lg transition-all"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={stopPlotterMode}
                className="py-2 px-4 bg-red-900/50 hover:bg-red-800/50 text-amber-100 rounded-lg transition-all"
              >
                停止
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-amber-900/30 pt-4 mt-auto">
        <button
          onClick={handleExportSVG}
          disabled={plotterMode.active}
          className="w-full py-3 px-4 bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-amber-100 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Download size={16} />
          导出SVG矢量图
        </button>
      </div>

      <div className="text-center text-xs text-amber-200/40 pt-2">
        <p>基于《仪象考成》恒星数据</p>
        <p className="mt-1">三垣二十八宿 · 古代星图</p>
      </div>
    </div>
  );
};
