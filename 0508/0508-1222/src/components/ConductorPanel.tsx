import { useSimulationStore } from '@/store/useSimulationStore';
import { Circle, Ruler } from 'lucide-react';

export function ConductorPanel() {
  const {
    conductors,
    selectedConductorId,
    newConductorRadius,
    setNewConductorRadius,
    updateConductorRadius,
    removeConductor,
  } = useSimulationStore();

  const selectedConductor = conductors.find((c) => c.id === selectedConductorId);

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Circle size={20} className="text-blue-400" />
        <h3 className="text-white font-semibold">导体球</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-slate-400 text-sm mb-2 flex items-center gap-1">
            <Ruler size={14} /> 新建导体半径
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="30"
              max="120"
              step="5"
              value={newConductorRadius}
              onChange={(e) => setNewConductorRadius(parseInt(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-blue-400 font-mono text-sm w-16 text-right">
              {newConductorRadius}px
            </span>
          </div>
        </div>

        {selectedConductor && (
          <div className="pt-3 border-t border-slate-700">
            <p className="text-slate-400 text-sm mb-3">选中导体设置</p>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">调整半径</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="120"
                    step="5"
                    value={selectedConductor.radius}
                    onChange={(e) => updateConductorRadius(selectedConductorId!, parseInt(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-blue-400 font-mono text-xs w-12 text-right">
                    {selectedConductor.radius}px
                  </span>
                </div>
              </div>

              <button
                onClick={() => removeConductor(selectedConductorId!)}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-red-900/50 hover:bg-red-800/50 text-red-300 transition-all"
              >
                删除导体
              </button>
            </div>
          </div>
        )}

        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-500">
            <span className="text-blue-400">提示:</span> 当导体球放置在电场中时，表面会出现感应电荷。正电荷区域显示蓝色，负电荷区域显示红色。
          </p>
        </div>
      </div>
    </div>
  );
}
