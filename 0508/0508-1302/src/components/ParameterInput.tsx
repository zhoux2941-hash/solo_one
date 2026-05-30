import React from 'react';
import { BayesianParams } from '../types';
import { diseasePresets } from '../data/presets';
import { formatProbability } from '../utils/formatters';

interface ParameterInputProps {
  params: BayesianParams;
  selectedPresetId: string;
  onParamChange: (key: keyof BayesianParams, value: number) => void;
  onPresetChange: (preset: BayesianParams & { id: string }) => void;
}

export const ParameterInput: React.FC<ParameterInputProps> = ({
  params,
  selectedPresetId,
  onParamChange,
  onPresetChange,
}) => {
  const sliderConfig = [
    {
      key: 'priorProbability' as const,
      label: '先验概率（患病率）',
      description: '人群中患有该疾病的概率',
      min: 0.001,
      max: 0.5,
      step: 0.001,
    },
    {
      key: 'sensitivity' as const,
      label: '检测灵敏度',
      description: '真阳性率：患病者检测为阳性的概率',
      min: 0.5,
      max: 1,
      step: 0.001,
    },
    {
      key: 'falsePositiveRate' as const,
      label: '假阳性率',
      description: '未患病者检测为阳性的概率',
      min: 0.001,
      max: 0.3,
      step: 0.001,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
        参数设置
      </h2>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          常见疾病预设
        </label>
        <select
          value={selectedPresetId}
          onChange={(e) => {
            const preset = diseasePresets.find(p => p.id === e.target.value);
            if (preset) {
              onPresetChange(preset);
            }
          }}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        >
          <option value="">选择预设疾病...</option>
          {diseasePresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      <div className="h-px bg-slate-200"></div>

      <div className="space-y-6">
        {sliderConfig.map(({ key, label, description, min, max, step }) => (
          <div key={key} className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {label}
                </label>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
              <span className="text-lg font-bold text-teal-600">
                {formatProbability(params[key])}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={params[key]}
              onChange={(e) => onParamChange(key, parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{formatProbability(min)}</span>
              <span>{formatProbability(max)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
