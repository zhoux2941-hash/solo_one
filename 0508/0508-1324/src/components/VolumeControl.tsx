import { Volume2, VolumeX, TrendingUp, TrendingDown } from 'lucide-react';

interface VolumeControlProps {
  highVolume: number;
  lowVolume: number;
  onHighVolumeChange: (volume: number) => void;
  onLowVolumeChange: (volume: number) => void;
}

export const VolumeControl = ({
  highVolume,
  lowVolume,
  onHighVolumeChange,
  onLowVolumeChange,
}: VolumeControlProps) => {
  const resetVolumes = () => {
    onHighVolumeChange(1);
    onLowVolumeChange(1);
  };

  const boostHigh = () => {
    onHighVolumeChange(1.8);
    onLowVolumeChange(0.2);
  };

  const boostLow = () => {
    onHighVolumeChange(0.2);
    onLowVolumeChange(1.8);
  };

  const handleHighVolumeChange = (volume: number) => {
    onHighVolumeChange(volume);
    const linkedLowVolume = Math.max(0, Math.min(2, 2 - volume));
    onLowVolumeChange(linkedLowVolume);
  };

  const handleLowVolumeChange = (volume: number) => {
    onLowVolumeChange(volume);
    const linkedHighVolume = Math.max(0, Math.min(2, 2 - volume));
    onHighVolumeChange(linkedHighVolume);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-wood-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold text-primary-600 flex items-center gap-2">
          <Volume2 size={20} />
          声部音量调节
        </h3>
        <div className="flex gap-2">
          <button
            onClick={boostHigh}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
          >
            <TrendingUp size={14} /> 突出高音
          </button>
          <button
            onClick={boostLow}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-wood-200 text-wood-500 hover:bg-wood-300 transition-colors"
          >
            <TrendingDown size={14} /> 突出低音
          </button>
          <button
            onClick={resetVolumes}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <VolumeX size={14} /> 重置
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 font-medium text-primary-600">
              <span className="w-3 h-3 rounded-full bg-primary-500"></span>
              高音部
            </label>
            <span className="text-sm font-mono text-gray-500">
              {Math.round(highVolume * 100)}%
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={highVolume}
              onChange={(e) => handleHighVolumeChange(parseFloat(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-gray-200 via-primary-300 to-primary-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full pointer-events-none transition-all duration-100"
              style={{ left: `${(highVolume / 2) * 100}%`, transform: `translate(-50%, -50%)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>静音</span>
            <span>正常</span>
            <span>增强</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 font-medium text-wood-500">
              <span className="w-3 h-3 rounded-full bg-wood-400"></span>
              低音部
            </label>
            <span className="text-sm font-mono text-gray-500">
              {Math.round(lowVolume * 100)}%
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={lowVolume}
              onChange={(e) => handleLowVolumeChange(parseFloat(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-gray-200 via-wood-300 to-wood-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-wood-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full pointer-events-none transition-all duration-100"
              style={{ left: `${(lowVolume / 2) * 100}%`, transform: `translate(-50%, -50%)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>静音</span>
            <span>正常</span>
            <span>增强</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-heritage-bg rounded-lg border border-wood-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-primary-600">提示：</span>
          音量滑块采用<span className="font-bold text-wine-500">「此消彼长」</span>联动模式，拉高一个声部的同时会自动降低另一个声部，帮助您更清晰地分辨声部特征。
        </p>
      </div>
    </div>
  );
};
