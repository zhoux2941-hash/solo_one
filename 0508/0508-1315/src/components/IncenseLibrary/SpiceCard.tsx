import React, { useState } from 'react';
import { Spice } from '../../types';
import { useIncenseStore } from '../../store/useIncenseStore';
import { Plus, Minus, X } from 'lucide-react';

interface SpiceCardProps {
  spice: Spice;
  index: number;
}

export const SpiceCard: React.FC<SpiceCardProps> = ({ spice, index }) => {
  const [grams, setGrams] = useState(1);
  const addSpice = useIncenseStore((state) => state.addSpice);
  const removeSpice = useIncenseStore((state) => state.removeSpice);
  const updateSpiceGrams = useIncenseStore((state) => state.updateSpiceGrams);
  const isSpiceSelected = useIncenseStore((state) => state.isSpiceSelected);
  const selectedSpices = useIncenseStore((state) => state.selectedSpices);

  const isSelected = isSpiceSelected(spice.id);
  const selected = selectedSpices.find((s) => s.spice.id === spice.id);

  const handleAdd = () => {
    if (isSelected) {
      updateSpiceGrams(spice.id, (selected?.grams || 0) + grams);
    } else {
      addSpice(spice, grams);
    }
  };

  const handleRemove = () => {
    removeSpice(spice.id);
  };

  const temperatureColors = {
    cool: 'from-sky-100 to-sky-200 border-sky-400',
    neutral: 'from-amber-50 to-amber-100 border-amber-300',
    warm: 'from-orange-100 to-orange-200 border-orange-400',
  };

  const temperatureLabels = {
    cool: '凉性',
    neutral: '平性',
    warm: '温性',
  };

  return (
    <div
      className={`relative bg-gradient-to-br ${temperatureColors[spice.temperature]} 
        rounded-xl p-4 border-2 transition-all duration-300 
        hover:shadow-lg hover:-translate-y-1 group
        ${isSelected ? 'ring-2 ring-amber-600 shadow-md' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {isSelected && (
        <button
          onClick={handleRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full 
            flex items-center justify-center hover:bg-red-600 transition-colors z-10"
        >
          <X size={14} />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="text-4xl">{spice.icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-800 text-lg">{spice.name}</h3>
            <span className="text-xs px-2 py-0.5 bg-white/60 rounded-full text-stone-600">
              {temperatureLabels[spice.temperature]}
            </span>
          </div>
          <p className="text-stone-500 text-sm italic">{spice.alias}</p>
        </div>
      </div>

      <p className="mt-2 text-stone-600 text-sm line-clamp-2">{spice.description}</p>

      <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
        <div className="flex gap-3">
          <span>浓度: {'●'.repeat(Math.ceil(spice.intensity / 2))}{'○'.repeat(5 - Math.ceil(spice.intensity / 2))}</span>
          <span>持久: {'●'.repeat(Math.ceil(spice.duration / 2))}{'○'.repeat(5 - Math.ceil(spice.duration / 2))}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex items-center bg-white rounded-lg overflow-hidden border border-stone-300">
          <button
            onClick={() => setGrams(Math.max(0.1, grams - 0.5))}
            className="px-3 py-1.5 hover:bg-stone-100 transition-colors"
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            value={grams}
            onChange={(e) => setGrams(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
            min="0.1"
            step="0.1"
            className="w-16 text-center border-x border-stone-300 py-1.5 focus:outline-none"
          />
          <button
            onClick={() => setGrams(grams + 0.5)}
            className="px-3 py-1.5 hover:bg-stone-100 transition-colors"
          >
            <Plus size={16} />
          </button>
          <span className="px-2 text-stone-500 text-sm">克</span>
        </div>

        <button
          onClick={handleAdd}
          className={`flex-1 py-2 rounded-lg font-medium transition-all duration-200
            ${isSelected
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-stone-700 text-white hover:bg-stone-800'
            }`}
        >
          {isSelected ? `已选 ${selected?.grams}g` : '加入香方'}
        </button>
      </div>
    </div>
  );
};
