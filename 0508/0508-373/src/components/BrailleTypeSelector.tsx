import type { BrailleType } from '../data/brailleTypes';
import { BrailleStrategyFactory } from '../utils/brailleConverter';

interface BrailleTypeSelectorProps {
  brailleType: BrailleType;
  onChange: (brailleType: BrailleType) => void;
}

export function BrailleTypeSelector({ brailleType, onChange }: BrailleTypeSelectorProps) {
  const strategies = BrailleStrategyFactory.getAvailableStrategies();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">盲文类型</h2>
      <div className="space-y-2">
        {strategies.map((strategy) => (
          <label
            key={strategy.type}
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
              brailleType === strategy.type
                ? 'bg-blue-50 border-2 border-blue-500'
                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <input
              type="radio"
              name="brailleType"
              value={strategy.type}
              checked={brailleType === strategy.type}
              onChange={() => onChange(strategy.type)}
              className="mr-3 w-4 h-4 text-blue-500 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-800">{strategy.name}</span>
              <p className="text-xs text-gray-500">{strategy.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}