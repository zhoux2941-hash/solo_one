import { Settings } from 'lucide-react';
import type { AbacusType } from '../types';

interface SettingsToggleProps {
  type: AbacusType;
  onTypeChange: (type: AbacusType) => void;
  disabled?: boolean;
}

export const SettingsToggle = ({ type, onTypeChange, disabled }: SettingsToggleProps) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-stone-800/50 border border-stone-700/50">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-amber-400" />
        <span className="text-amber-200 font-medium">算盘类型</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onTypeChange('2-5')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            type === '2-5'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-stone-700/50 text-amber-200 hover:bg-stone-600/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          上二下五
        </button>
        <button
          onClick={() => onTypeChange('1-4')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            type === '1-4'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-stone-700/50 text-amber-200 hover:bg-stone-600/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          上一下四
        </button>
      </div>
    </div>
  );
};
