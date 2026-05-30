import React from 'react';
import { useIncenseStore } from '../../store/useIncenseStore';
import { getAromaTypeName } from '../../utils/formulaAnalyzer';
import { Sparkles, Wind, Droplets, Mountain, Award, MessageCircle } from 'lucide-react';

export const FormulaAnalyzer: React.FC = () => {
  const analysis = useIncenseStore((state) => state.analysis);
  const formulaName = useIncenseStore((state) => state.formulaName);
  const setFormulaName = useIncenseStore((state) => state.setFormulaName);

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 
        border border-amber-200 text-center">
        <Sparkles className="mx-auto text-amber-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-stone-600 mb-2">香方分析</h3>
        <p className="text-sm text-stone-500">选择香料后，系统将自动分析香气特征</p>
      </div>
    );
  }

  const aromaTypeColors: Record<string, string> = {
    '清雅': 'from-emerald-500 to-teal-600',
    '浓郁': 'from-amber-500 to-orange-600',
    '温润': 'from-amber-400 to-yellow-500',
    '清冽': 'from-sky-400 to-cyan-500',
    '醇厚': 'from-stone-500 to-stone-700',
    '淡雅': 'from-rose-400 to-pink-500',
  };

  const attributeLabels: Record<string, string> = {
    woody: '木质',
    spicy: '辛香',
    fresh: '清凉',
    sweet: '甘甜',
    musk: '麝香',
  };

  return (
    <div className="bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-xl 
      border border-stone-200 overflow-hidden">
      <div className="bg-gradient-to-r from-stone-800 to-stone-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-amber-400" size={24} />
            <div>
              <h3 className="text-white font-bold">香方分析</h3>
              <p className="text-stone-400 text-sm">智能品鉴您的专属香方</p>
            </div>
          </div>
          <input
            type="text"
            value={formulaName}
            onChange={(e) => setFormulaName(e.target.value)}
            className="bg-white/10 text-white placeholder-stone-400 px-3 py-2 
              rounded-lg border border-white/20 focus:outline-none focus:border-amber-400
              w-40 text-center"
            placeholder="香方名称"
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className={`inline-block px-8 py-4 rounded-2xl bg-gradient-to-br 
            ${aromaTypeColors[analysis.aromaType] || 'from-stone-500 to-stone-700'}
            shadow-lg transform hover:scale-105 transition-transform`}
          >
            <p className="text-white/70 text-sm mb-1">香气类型</p>
            <p className="text-white text-3xl font-bold tracking-wider">
              {analysis.aromaType}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 text-center border border-stone-200">
            <Wind className="mx-auto text-sky-500 mb-2" size={24} />
            <p className="text-xs text-stone-500 mb-1">前调</p>
            <p className="font-medium text-stone-800 text-sm">{analysis.topNote}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-stone-200">
            <Droplets className="mx-auto text-amber-500 mb-2" size={24} />
            <p className="text-xs text-stone-500 mb-1">中调</p>
            <p className="font-medium text-stone-800 text-sm">{analysis.middleNote}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-stone-200">
            <Mountain className="mx-auto text-stone-600 mb-2" size={24} />
            <p className="text-xs text-stone-500 mb-1">尾调</p>
            <p className="font-medium text-stone-800 text-sm">{analysis.baseNote}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-stone-700">香气组成</p>
            <div className="flex items-center gap-1 text-amber-600">
              <Award size={16} />
              <span className="font-bold">{analysis.overallScore}</span>
              <span className="text-stone-500 text-sm">分</span>
            </div>
          </div>
          <div className="space-y-2">
            {Object.entries(analysis.attributes).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-stone-600 w-12">
                  {attributeLabels[key as keyof typeof attributeLabels]}
                </span>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 
                      rounded-full transition-all duration-500"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-xs text-stone-500 w-8 text-right">{value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-200">
          <MessageCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-stone-700 leading-relaxed">{analysis.suggestion}</p>
        </div>
      </div>
    </div>
  );
};
