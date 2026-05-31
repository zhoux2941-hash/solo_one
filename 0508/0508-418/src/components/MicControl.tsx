import { Mic, MicOff, Activity, AlertTriangle } from 'lucide-react';
import { FormantData } from '@/hooks/useAudioAnalysis';

interface MicControlProps {
  isActive: boolean;
  isRecording: boolean;
  error: string | null;
  currentFormant: FormantData | null;
  onToggle: () => void;
}

export const MicControl = ({
  isActive,
  isRecording,
  error,
  currentFormant,
  onToggle,
}: MicControlProps) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-400 mb-2">
        实时语音分析
      </label>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <button
          onClick={onToggle}
          disabled={isRecording && !isActive}
          className={`w-full flex items-center justify-between p-4 transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30'
              : 'hover:bg-slate-700/30'
          } ${isRecording && !isActive ? 'opacity-60 cursor-wait' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-700'
              }`}
            >
              {isActive ? (
                <Mic className="text-white animate-pulse" size={22} />
              ) : (
                <MicOff className="text-slate-400" size={22} />
              )}
            </div>
            <div className="text-left">
              <div className="font-medium text-white">
                {isActive ? '正在监听...' : '麦克风'}
              </div>
              <div className="text-sm text-slate-400">
                {isActive
                  ? '分析语音共振峰'
                  : '点击启用实时分析'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <Activity size={14} className="text-emerald-400 animate-pulse" />
                <span className="text-sm text-emerald-400 font-mono">LIVE</span>
              </div>
            )}
            <div
              className={`w-12 h-6 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-slate-700'
              } relative`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isActive ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </div>
          </div>
        </button>

        {isActive && currentFormant && (
          <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">F1 (实时)</div>
                <div className="text-xl font-bold text-emerald-400 font-mono">
                  {currentFormant.f1}
                  <span className="text-sm text-slate-500 ml-1">Hz</span>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">F2 (实时)</div>
                <div className="text-xl font-bold text-teal-400 font-mono">
                  {currentFormant.f2}
                  <span className="text-sm text-slate-500 ml-1">Hz</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="text-xs text-slate-500">置信度:</div>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-150"
                  style={{ width: `${currentFormant.confidence * 100}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {Math.round(currentFormant.confidence * 100)}%
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 border-t border-red-500/30 bg-red-500/10">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-400">{error}</div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        发音时，绿点将在图表上实时显示你的共振峰位置
      </p>
    </div>
  );
};
