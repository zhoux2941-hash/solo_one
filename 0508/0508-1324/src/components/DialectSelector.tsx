import { Check } from 'lucide-react';
import type { Dialect } from '@/types';
import { getDialectName } from '@/utils/audio';

interface DialectSelectorProps {
  selectedDialect: Dialect;
  onSelect: (dialect: Dialect) => void;
}

export const DialectSelector = ({ selectedDialect, onSelect }: DialectSelectorProps) => {
  const dialects: Dialect[] = ['sanjiang', 'congjiang', 'liping'];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-semibold text-primary-600">选择方言版本</h3>
      <div className="grid grid-cols-3 gap-4">
        {dialects.map((dialect) => {
          const isSelected = selectedDialect === dialect;
          return (
            <button
              key={dialect}
              onClick={() => onSelect(dialect)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-wood-200 bg-white hover:border-primary-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
              <div className="text-center">
                <div
                  className={`text-2xl font-display font-bold mb-2 ${
                    isSelected ? 'text-primary-600' : 'text-heritage-text'
                  }`}
                >
                  {getDialectName(dialect)}
                </div>
                <div className="text-sm text-gray-500">
                  {dialect === 'sanjiang' && '广西三江'}
                  {dialect === 'congjiang' && '贵州从江'}
                  {dialect === 'liping' && '贵州黎平'}
                </div>
              </div>
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl transition-all duration-300 ${
                  isSelected ? 'bg-primary-500' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
