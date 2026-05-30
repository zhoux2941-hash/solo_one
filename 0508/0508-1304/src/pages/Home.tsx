import { useState, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { GridCanvas } from '../components/Simulator/GridCanvas';
import { Statistics } from '../components/Simulator/Statistics';
import { SimulationControls } from '../components/ControlPanel/SimulationControls';
import { SliderControl } from '../components/ControlPanel/SliderControl';
import { WindDirection } from '../components/ControlPanel/WindDirection';
import { PresetScenes } from '../components/ControlPanel/PresetScenes';
import { WindDirection as WindDir, PresetScene, SimulationParams } from '../engine/types';
import { PRESET_SCENES, DEFAULT_PARAMS } from '../engine/constants';
import { Flame, Trees, Droplets, Wind, Settings2 } from 'lucide-react';

export default function Home() {
  const {
    isRunning,
    stats,
    gridVersion,
    start,
    pause,
    reset,
    step,
    ignite,
    placeFirefighter,
    setParams,
    getGrid,
    getParams,
  } = useSimulation();

  const [params, setLocalParams] = useState<SimulationParams>(DEFAULT_PARAMS);

  useEffect(() => {
    const currentParams = getParams();
    if (currentParams) {
      setLocalParams(currentParams);
    }
  }, [getParams]);

  const handleCellClick = (x: number, y: number) => {
    if (!isRunning) {
      ignite(x, y);
    }
  };

  const handleCellRightClick = (x: number, y: number) => {
    placeFirefighter(x, y);
  };

  const handleTreeDensityChange = (value: number) => {
    setLocalParams((prev) => ({ ...prev, treeDensity: value }));
    setParams({ treeDensity: value });
  };

  const handleHumidityChange = (value: number) => {
    setLocalParams((prev) => ({ ...prev, humidity: value }));
    setParams({ humidity: value });
  };

  const handleWindDirectionChange = (direction: WindDir) => {
    setLocalParams((prev) => ({ ...prev, windDirection: direction }));
    setParams({ windDirection: direction });
  };

  const handleWindStrengthChange = (value: number) => {
    setLocalParams((prev) => ({ ...prev, windStrength: value / 100 }));
    setParams({ windStrength: value / 100 });
  };

  const handlePresetSelect = (scene: PresetScene) => {
    const preset = PRESET_SCENES[scene];
    if (preset) {
      const newParams = { ...DEFAULT_PARAMS, ...preset.params };
      setLocalParams(newParams);
      setParams(newParams);
    }
  };

  const hasFire = stats.burningTrees > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMmNiNzEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTIwIDIwYzAtMTEuMDQ2LTguOTU0LTIwLTIwLTIwdjIwYzExLjA0NiAwIDIwLTguOTU0IDIwLTIwem0wIDIwYzAtMTEuMDQ2LTguOTU0LTIwLTIwLTIwdjIwYzExLjA0NiAwIDIwLTguOTU0IDIwLTIwem0yMC0yMGMwLTExLjA0Ni04Ljk1NC0yMC0yMC0yMHYyMGMxMS4wNDYgMCAyMC04Ljk1NCAyMC0yMHptMCAyMGMwLTExLjA0Ni04Ljk1NC0yMC0yMC0yMHYyMGMxMS4wNDYgMCAyMC04Ljk1NCAyMC0yMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Flame className="w-10 h-10 text-orange-500 animate-pulse" />
            森林火灾蔓延模拟器
            <Trees className="w-10 h-10 text-emerald-500" />
          </h1>
          <p className="text-slate-400">
            基于元胞自动机的交互式火灾模拟实验平台
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80 space-y-6">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-5 shadow-xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-emerald-400" />
                模拟控制
              </h3>
              <SimulationControls
                isRunning={isRunning}
                onStart={start}
                onPause={pause}
                onStep={step}
                onReset={reset}
                hasFire={hasFire}
              />
            </div>

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-5 shadow-xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Trees className="w-5 h-5 text-emerald-400" />
                环境参数
              </h3>
              <div className="space-y-5">
                <SliderControl
                  label="树木密度"
                  value={params.treeDensity}
                  onChange={handleTreeDensityChange}
                  disabled={isRunning}
                />
                <SliderControl
                  label="空气湿度"
                  value={params.humidity}
                  onChange={handleHumidityChange}
                  disabled={isRunning}
                />
                <SliderControl
                  label="风力强度"
                  value={Math.round(params.windStrength * 100)}
                  onChange={handleWindStrengthChange}
                  disabled={isRunning}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-5 shadow-xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Wind className="w-5 h-5 text-emerald-400" />
                风向设置
              </h3>
              <WindDirection
                value={params.windDirection}
                onChange={handleWindDirectionChange}
                disabled={isRunning}
              />
            </div>

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-5 shadow-xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-emerald-400" />
                预设场景
              </h3>
              <PresetScenes
                onSelect={handlePresetSelect}
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex justify-center">
              <GridCanvas
                grid={getGrid()}
                gridVersion={gridVersion}
                onCellClick={handleCellClick}
                onCellRightClick={handleCellRightClick}
                canvasSize={600}
              />
            </div>

            <Statistics stats={stats} />

            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl p-5 shadow-xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-3">图例说明</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#228B22' }} />
                  <span className="text-sm text-slate-300">树木</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#FF4500' }} />
                  <span className="text-sm text-slate-300">燃烧中</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#696969' }} />
                  <span className="text-sm text-slate-300">灰烬</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#8B4513' }} />
                  <span className="text-sm text-slate-300">空地</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: '#1E90FF' }}>
                    🧑‍🚒
                  </div>
                  <span className="text-sm text-slate-300">灭火队</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">💡 左键点击树木点燃火源 | 右键点击空地放置灭火队</p>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>🔥 点击网格中的树木点燃火源，观察火势蔓延规律</p>
        </footer>
      </div>
    </div>
  );
}
