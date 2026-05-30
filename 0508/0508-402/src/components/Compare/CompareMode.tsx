import React, { useMemo } from 'react';
import { ArrowRightLeft, TrendingUp, TrendingDown, Minus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getCityById } from '../../data/cities';
import { getStructuresByCityId, getDescriptionsByCityId } from '../../data/drainageData';
import { compareCities, compareDescriptions, CompareResult } from '../../utils/compareUtils';
import { DrainageMap } from '../DrainageSystem/DrainageMap';
import { cn } from '../../utils';
import { CATEGORY_LABELS } from '../../types';

interface CompareRowProps {
  result: CompareResult;
}

const CompareRow: React.FC<CompareRowProps> = ({ result }) => {
  const getDifferenceIcon = () => {
    switch (result.difference) {
      case 'higher':
        return <TrendingUp size={16} className="text-green-600" />;
      case 'lower':
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return <Minus size={16} className="text-slategray-400" />;
    }
  };

  return (
    <tr className="border-b border-ochre-100 hover:bg-ochre-50/50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-ochre-700 whitespace-nowrap">
        {result.aspect}
      </td>
      <td className={cn(
        'py-3 px-4 text-sm text-center',
        result.difference === 'higher' && 'text-green-700 font-medium bg-green-50/50',
        result.difference === 'lower' && 'text-red-600',
      )}>
        {result.city1Value}
      </td>
      <td className="py-3 px-2 text-center">
        {getDifferenceIcon()}
      </td>
      <td className={cn(
        'py-3 px-4 text-sm text-center',
        result.difference === 'lower' && 'text-green-700 font-medium bg-green-50/50',
        result.difference === 'higher' && 'text-red-600',
      )}>
        {result.city2Value}
      </td>
    </tr>
  );
};

interface CategorySectionProps {
  title: string;
  results: CompareResult[];
  defaultOpen?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({ title, results, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-ochre-50 rounded-t-xl border border-ochre-200 hover:bg-ochre-100/50 transition-colors"
      >
        <span className="font-serif font-bold text-ochre-700">{title}</span>
        {isOpen ? <ChevronUp size={20} className="text-ochre-500" /> : <ChevronDown size={20} className="text-ochre-500" />}
      </button>
      {isOpen && (
        <div className="border-x border-b border-ochre-200 rounded-b-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-cream-100">
                <th className="py-3 px-4 text-left text-sm font-medium text-ochre-600 w-1/4">对比项</th>
                <th className="py-3 px-4 text-center text-sm font-medium text-ochre-600 w-1/3">城池1</th>
                <th className="py-3 px-2 w-10"></th>
                <th className="py-3 px-4 text-center text-sm font-medium text-ochre-600 w-1/3">城池2</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <CompareRow key={result.aspect} result={result} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';

export const CompareMode: React.FC = () => {
  const { compareCityIds, toggleCompareMode, removeCompareCity } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'descriptions'>('overview');

  const city1 = useMemo(() => getCityById(compareCityIds[0]), [compareCityIds]);
  const city2 = useMemo(() => getCityById(compareCityIds[1]), [compareCityIds]);

  const structures1 = useMemo(() => compareCityIds[0] ? getStructuresByCityId(compareCityIds[0]) : [], [compareCityIds]);
  const structures2 = useMemo(() => compareCityIds[1] ? getStructuresByCityId(compareCityIds[1]) : [], [compareCityIds]);

  const descriptions1 = useMemo(() => compareCityIds[0] ? getDescriptionsByCityId(compareCityIds[0]) : [], [compareCityIds]);
  const descriptions2 = useMemo(() => compareCityIds[1] ? getDescriptionsByCityId(compareCityIds[1]) : [], [compareCityIds]);

  const comparisonResult = useMemo(() => {
    if (!city1 || !city2) return [];
    return compareCities(city1, city2, structures1, structures2);
  }, [city1, city2, structures1, structures2]);

  const descriptionComparison = useMemo(() => {
    if (descriptions1.length === 0 || descriptions2.length === 0) return [];
    return compareDescriptions(descriptions1, descriptions2);
  }, [descriptions1, descriptions2]);

  if (compareCityIds.length < 2) {
    return (
      <div className="bg-cream-50 border-2 border-dashed border-ochre-300 rounded-xl p-12 text-center">
        <div className="inline-flex p-4 bg-ochre-100 rounded-full mb-4">
          <ArrowRightLeft size={32} className="text-ochre-600" />
        </div>
        <h3 className="font-serif text-xl font-bold text-ochre-700 mb-2">选择两个城池进行对比</h3>
        <p className="text-slategray-500 mb-6">请在上方面板中点击两个城池卡片，将它们加入对比</p>
        <button
          onClick={toggleCompareMode}
          className="px-6 py-2 bg-ochre-500 text-white rounded-lg hover:bg-ochre-600 transition-colors"
        >
          退出对比模式
        </button>
      </div>
    );
  }

  if (!city1 || !city2) return null;

  const basicInfoResults = comparisonResult.filter(r => r.category === '基本信息');
  const drainageResults = comparisonResult.filter(r => r.category === '排水设施');
  const defenseResults = comparisonResult.filter(r => r.category === '防御系统');

  const tabs = [
    { id: 'overview', label: '概览对比' },
    { id: 'details', label: '结构图对比' },
    { id: 'descriptions', label: '设计理念对比' },
  ] as const;

  return (
    <div className="bg-cream-50 rounded-xl overflow-hidden border border-ochre-200">
      <div className="px-6 py-4 bg-gradient-to-r from-navy-500 to-navy-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowRightLeft size={24} />
            <h3 className="font-serif text-xl font-bold">排水系统对比分析</h3>
          </div>
          <button
            onClick={toggleCompareMode}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <X size={18} />
            退出对比
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-ochre-200 bg-cream-100/50">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-navy-500" />
            <div>
              <p className="font-serif font-bold text-ochre-700">{city1.name}</p>
              <p className="text-xs text-slategray-500">{city1.dynasty}</p>
            </div>
            <button
              onClick={() => removeCompareCity(city1.id)}
              className="p-1 hover:bg-ochre-200 rounded transition-colors"
            >
              <X size={14} className="text-slategray-500" />
            </button>
          </div>
          <div className="p-2 bg-navy-100 rounded-full">
            <ArrowRightLeft size={20} className="text-navy-600" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-ochre-500" />
            <div>
              <p className="font-serif font-bold text-ochre-700">{city2.name}</p>
              <p className="text-xs text-slategray-500">{city2.dynasty}</p>
            </div>
            <button
              onClick={() => removeCompareCity(city2.id)}
              className="p-1 hover:bg-ochre-200 rounded transition-colors"
            >
              <X size={14} className="text-slategray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex border-b border-ochre-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-3 px-4 font-medium transition-colors',
              activeTab === tab.id
                ? 'text-navy-600 border-b-2 border-navy-500 bg-navy-50'
                : 'text-slategray-500 hover:text-ochre-600 hover:bg-ochre-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {basicInfoResults.length > 0 && (
              <CategorySection title="基本信息对比" results={basicInfoResults} />
            )}
            {drainageResults.length > 0 && (
              <CategorySection title="排水设施对比" results={drainageResults} />
            )}
            {defenseResults.length > 0 && (
              <CategorySection title="防御系统对比" results={defenseResults} />
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DrainageMap city={city1} showTitle={true} />
            <DrainageMap city={city2} showTitle={true} />
          </div>
        )}

        {activeTab === 'descriptions' && (
          <div className="space-y-6">
            {descriptionComparison.map((item) => (
              <div key={item.category} className="border border-ochre-200 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-gradient-to-r from-ochre-100 to-transparent">
                  <h4 className="font-serif font-bold text-ochre-700">
                    {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]}
                  </h4>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-navy-50 rounded-xl border border-navy-100">
                      <h5 className="font-medium text-navy-700 mb-2">{city1.name}</h5>
                      <p className="text-sm text-slategray-600 leading-relaxed">{item.city1.content}</p>
                    </div>
                    <div className="p-4 bg-ochre-50 rounded-xl border border-ochre-100">
                      <h5 className="font-medium text-ochre-700 mb-2">{city2.name}</h5>
                      <p className="text-sm text-slategray-600 leading-relaxed">{item.city2.content}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                        <TrendingUp size={16} /> 共通点
                      </h6>
                      <ul className="space-y-1">
                        {item.similarities.map((sim, idx) => (
                          <li key={idx} className="text-sm text-slategray-600 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {sim}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-ochre-700 mb-2 flex items-center gap-2">
                        <ArrowRightLeft size={16} /> 差异点
                      </h6>
                      <ul className="space-y-1">
                        {item.differences.map((diff, idx) => (
                          <li key={idx} className="text-sm text-slategray-600 flex items-start gap-2">
                            <span className="text-ochre-500 mt-1">•</span>
                            {diff}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
