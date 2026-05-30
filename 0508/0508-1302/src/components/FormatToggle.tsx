import React from 'react';
import { DisplayFormat } from '../types';
import { Percent, Users } from 'lucide-react';

interface FormatToggleProps {
  format: DisplayFormat;
  onChange: (format: DisplayFormat) => void;
}

export const FormatToggle: React.FC<FormatToggleProps> = ({ format, onChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <p className="text-sm text-slate-600 mb-3 font-medium">显示格式</p>
      <div className="flex rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => onChange('probability')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            format === 'probability'
              ? 'bg-white text-teal-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Percent className="w-4 h-4" />
          概率格式
        </button>
        <button
          onClick={() => onChange('frequency')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            format === 'frequency'
              ? 'bg-white text-teal-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          频率格式
        </button>
      </div>
    </div>
  );
};
