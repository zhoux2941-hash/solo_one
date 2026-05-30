import React from 'react';
import { ThemeType } from '../../types';
import { Filter } from 'lucide-react';

interface FilterBarProps {
  selectedTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ selectedTheme, onThemeChange }) => {
  const themes: { value: ThemeType; label: string; icon: string }[] = [
    { value: 'all', label: '全部', icon: '🎨' },
    { value: '门神', label: '门神', icon: '⚔️' },
    { value: '吉祥喜庆', label: '吉祥喜庆', icon: '🧧' },
    { value: '戏文故事', label: '戏文故事', icon: '🎭' }
  ];

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200 px-6 py-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-amber-800">
            <Filter size={20} />
            <span className="font-semibold">按主题筛选：</span>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {themes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => onThemeChange(theme.value)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 border-2 ${
                selectedTheme === theme.value
                  ? 'bg-red-700 text-white border-red-700 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-amber-300 hover:border-red-500 hover:text-red-700 hover:shadow-md'
              }`}
            >
              <span className="text-lg">{theme.icon}</span>
              <span>{theme.label}</span>
            </button>
          ))}
        </div>

        <div className="text-sm text-amber-700 font-medium">
          {selectedTheme === 'all' 
            ? '显示全部 8 个年画产地' 
            : `筛选「${selectedTheme}」主题的年画产地`
          }
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
