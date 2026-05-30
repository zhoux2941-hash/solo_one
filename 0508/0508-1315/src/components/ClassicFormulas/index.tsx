import React from 'react';
import { CLASSIC_FORMULAS } from '../../data/classicFormulas';
import { SPICES, getSpiceById } from '../../data/spices';
import { useIncenseStore } from '../../store/useIncenseStore';
import { SelectedSpice } from '../../types';
import { BookOpen, History, Sparkles } from 'lucide-react';

export const ClassicFormulas: React.FC = () => {
  const loadFormula = useIncenseStore((state) => state.loadFormula);

  const handleLoad = (formulaId: string, formulaName: string) => {
    const formula = CLASSIC_FORMULAS.find((f) => f.id === formulaId);
    if (!formula) return;

    const ingredients: SelectedSpice[] = formula.ingredients
      .map((ing) => {
        const spice = getSpiceById(ing.spiceId);
        if (!spice) return null;
        return { spice, grams: ing.grams };
      })
      .filter((item): item is SelectedSpice => item !== null);

    if (ingredients.length > 0) {
      loadFormula(ingredients, formulaName);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <BookOpen className="text-amber-700" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-800">经典香方</h2>
          <p className="text-sm text-stone-500">历代传承的香道瑰宝</p>
        </div>
      </div>

      <div className="space-y-4">
        {CLASSIC_FORMULAS.map((formula, index) => (
          <div
            key={formula.id}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl 
              border border-amber-200 overflow-hidden hover:shadow-lg 
              transition-all duration-300 group"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="text-amber-600" size={16} />
                    <span className="text-xs text-amber-700 font-medium">
                      {formula.era} · {formula.origin}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 mt-1">
                    {formula.name}
                  </h3>
                </div>
                <button
                  onClick={() => handleLoad(formula.id, formula.name)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 
                    text-white rounded-lg text-sm font-medium hover:from-amber-600 
                    hover:to-orange-600 transition-all shadow-md hover:shadow-amber-500/30
                    flex items-center gap-1"
                >
                  <Sparkles size={14} />
                  一键加载
                </button>
              </div>

              <p className="text-sm text-stone-600 mb-3 leading-relaxed">
                {formula.description}
              </p>

              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-stone-500 mb-2">配伍：</p>
                <div className="flex flex-wrap gap-2">
                  {formula.ingredients.map((ing) => {
                    const spice = getSpiceById(ing.spiceId);
                    if (!spice) return null;
                    return (
                      <span
                        key={ing.spiceId}
                        className="inline-flex items-center gap-1 px-2 py-1 
                          bg-white rounded-full text-xs text-stone-700 
                          border border-stone-200"
                      >
                        <span>{spice.icon}</span>
                        {spice.name} {ing.grams}g
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-amber-200/50">
                <p className="text-xs text-stone-500 italic leading-relaxed">
                  「{formula.story}」
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
