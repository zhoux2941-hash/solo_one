import { useSimulationStore } from '@/store/useSimulationStore';
import { Magnet, ArrowUp, ArrowDown } from 'lucide-react';

export function MagneticFieldPanel() {
  const { magneticField, setMagneticFieldStrength, setMagneticFieldDirection } =
    useSimulationStore();

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Magnet size={20} className="text-purple-400" />
        <h3 className="text-white font-semibold">匀强磁场</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-slate-400 text-sm mb-2 block">磁场强度</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="0.02"
              step="0.001"
              value={magneticField.strength}
              onChange={(e) => setMagneticFieldStrength(parseFloat(e.target.value))}
              className="flex-1 accent-purple-500"
            />
            <span className="text-purple-400 font-mono text-sm w-20 text-right">
              {(magneticField.strength * 1e3).toFixed(1)} mT
            </span>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-sm mb-2 block">磁场方向</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMagneticFieldDirection('out')}
              className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all ${
                magneticField.direction === 'out'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <ArrowUp size={16} />
              向外
            </button>
            <button
              onClick={() => setMagneticFieldDirection('into')}
              className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all ${
                magneticField.direction === 'into'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <ArrowDown size={16} />
              向内
            </button>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-500">
            <span className="text-purple-400">提示:</span> 磁场方向垂直于屏幕，使用右手定则判断洛伦兹力方向
          </p>
        </div>
      </div>
    </div>
  );
}
