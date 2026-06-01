import React from 'react';
import { Waves, Sliders, Eye, EyeOff } from 'lucide-react';
import type { WaveformType } from '../types';
import { getWaveformName, getWaveformFormula } from '../utils/fourierCalculations';

interface ControlPanelProps {
  harmonicCount: number;
  setHarmonicCount: (count: number) => void;
  waveformType: WaveformType;
  setWaveformType: (type: WaveformType) => void;
  showIndividualHarmonics: boolean;
  setShowIndividualHarmonics: (show: boolean) => void;
}

const waveformTypes: { value: WaveformType; label: string }[] = [
  { value: 'square', label: '方波' },
  { value: 'triangle', label: '三角波' },
  { value: 'sawtooth', label: '锯齿波' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  harmonicCount,
  setHarmonicCount,
  waveformType,
  setWaveformType,
  showIndividualHarmonics,
  setShowIndividualHarmonics,
}) => {
  return (
    <div className="bg-[#12121f] rounded-xl p-6 border border-cyan-500/20 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <Sliders className="w-6 h-6 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold text-white">控制面板</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">
            谐波次数: <span className="text-white font-bold text-lg">{harmonicCount}</span>
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={harmonicCount}
            onChange={(e) => setHarmonicCount(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-3">
            <Waves className="w-4 h-4 inline mr-2" />
            波形类型
          </label>
          <div className="grid grid-cols-3 gap-2">
            {waveformTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setWaveformType(type.value)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  waveformType === type.value
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
          <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 font-mono">
              {getWaveformFormula(waveformType)}
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={() => setShowIndividualHarmonics(!showIndividualHarmonics)}
            className={`flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              showIndividualHarmonics
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            {showIndividualHarmonics ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
            {showIndividualHarmonics ? '隐藏各次谐波' : '显示各次谐波'}
          </button>
        </div>
      </div>
    </div>
  );
};
