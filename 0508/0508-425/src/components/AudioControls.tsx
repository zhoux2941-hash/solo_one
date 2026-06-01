import React from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import type { HarmonicData } from '../types';

interface AudioControlsProps {
  isPlaying: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  onToggle: () => void;
  harmonics: HarmonicData[];
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  volume,
  setVolume,
  onToggle,
  harmonics,
}) => {
  return (
    <div className="bg-[#12121f] rounded-xl p-6 border border-green-500/20 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <Volume2 className="w-6 h-6 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white">音频合成</h2>
      </div>

      <div className="space-y-4">
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
            isPlaying
              ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50'
              : 'bg-gradient-to-r from-green-500 to-cyan-500 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-6 h-6 animate-pulse" />
              停止播放
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              播放合成声音
            </>
          )}
        </button>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">音量</span>
            <button
              onClick={() => setVolume(volume === 0 ? 0.3 : 0)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {Math.round(volume * 100)}%
          </div>
        </div>

        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">当前谐波成分</p>
          <div className="flex flex-wrap gap-2">
            {harmonics.slice(0, 8).map((h, i) => (
              <div
                key={i}
                className="px-2 py-1 rounded text-xs font-mono"
                style={{ 
                  backgroundColor: `${h.color}20`,
                  color: h.color,
                  border: `1px solid ${h.color}40`
                }}
              >
                {h.n}次
              </div>
            ))}
            {harmonics.length > 8 && (
              <div className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
                +{harmonics.length - 8} 更多
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>🎵 使用 Web Audio API 实时合成</p>
          <p className="mt-1">每个谐波对应一个正弦波振荡器</p>
        </div>
      </div>
    </div>
  );
};
