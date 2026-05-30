import React from 'react';
import { useIncenseStore } from '../../store/useIncenseStore';
import { Trash2, Scale } from 'lucide-react';

export const SelectedList: React.FC = () => {
  const selectedSpices = useIncenseStore((state) => state.selectedSpices);
  const updateSpiceGrams = useIncenseStore((state) => state.updateSpiceGrams);
  const removeSpice = useIncenseStore((state) => state.removeSpice);
  const clearFormula = useIncenseStore((state) => state.clearFormula);
  const analysis = useIncenseStore((state) => state.analysis);

  if (selectedSpices.length === 0) {
    return (
      <div className="bg-stone-100/50 rounded-xl p-6 text-center border-2 border-dashed border-stone-300">
        <Scale className="mx-auto text-stone-400 mb-2" size={32} />
        <p className="text-stone-500">请从香料库中选择香料</p>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-800 flex items-center gap-2">
          <Scale size={18} />
          已选香料
        </h3>
        <div className="flex items-center gap-4">
          {analysis && (
            <span className="text-sm text-stone-600">
              总重: <span className="font-bold text-amber-700">{analysis.totalWeight}g</span>
            </span>
          )}
          <button
            onClick={clearFormula}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <Trash2 size={14} />
            清空
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {selectedSpices.map((item) => (
          <div
            key={item.spice.id}
            className="flex items-center justify-between bg-white rounded-lg p-3 
              border border-stone-200 hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.spice.icon}</span>
              <div>
                <p className="font-medium text-stone-800">{item.spice.name}</p>
                <p className="text-xs text-stone-500">{item.spice.alias}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={item.grams}
                onChange={(e) => updateSpiceGrams(item.spice.id, parseFloat(e.target.value) || 0)}
                min="0.1"
                step="0.1"
                className="w-16 text-center border border-stone-300 rounded py-1 
                  focus:outline-none focus:border-amber-400 text-sm"
              />
              <span className="text-sm text-stone-500">g</span>
              <button
                onClick={() => removeSpice(item.spice.id)}
                className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 
                  rounded transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
