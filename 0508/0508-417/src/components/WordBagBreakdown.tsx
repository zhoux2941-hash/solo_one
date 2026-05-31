import React, { useState } from 'react';
import { BookOpen, Info } from 'lucide-react';
import { WordContribution } from '../types/classifier';

interface WordBagBreakdownProps {
  contributions: WordContribution[];
}

export const WordBagBreakdown: React.FC<WordBagBreakdownProps> = ({ contributions }) => {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  if (contributions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">词袋分解</h2>
            <p className="text-sm text-gray-500">每个词对分类结果的概率贡献</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <BookOpen className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-center">分类后将显示词袋分解</p>
        </div>
      </div>
    );
  }

  const getWordColor = (contribution: number) => {
    if (contribution > 0.5) return 'bg-red-500';
    if (contribution > 0.2) return 'bg-red-400';
    if (contribution > 0) return 'bg-red-300';
    if (contribution > -0.2) return 'bg-green-300';
    if (contribution > -0.5) return 'bg-green-400';
    return 'bg-green-500';
  };

  const getTextColor = (contribution: number) => {
    return contribution > 0 ? 'text-red-600' : 'text-green-600';
  };

  const getBorderColor = (contribution: number) => {
    return contribution > 0 ? 'border-red-200 hover:border-red-400' : 'border-green-200 hover:border-green-400';
  };

  const getWordSize = (contribution: number) => {
    const abs = Math.abs(contribution);
    if (abs > 0.8) return 'text-xl font-bold';
    if (abs > 0.5) return 'text-lg font-semibold';
    if (abs > 0.2) return 'text-base font-medium';
    return 'text-sm';
  };

  const maxContribution = Math.max(...contributions.map(c => Math.abs(c.contribution)));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">词袋分解</h2>
          <p className="text-sm text-gray-500">每个词对分类结果的概率贡献</p>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-red-300 to-red-500" />
          <span className="text-gray-600">垃圾邮件贡献</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-green-300" />
          <span className="text-gray-600">正常邮件贡献</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 min-h-[120px] p-4 bg-gray-50 rounded-xl">
        {contributions.slice(0, 30).map((wc, index) => {
          const normalizedContribution = wc.contribution / maxContribution;
          return (
            <div
              key={index}
              className={`relative px-3 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 transform hover:scale-110 ${getBorderColor(wc.contribution)} bg-white`}
              onMouseEnter={() => setHoveredWord(wc.word)}
              onMouseLeave={() => setHoveredWord(null)}
            >
              <span className={`${getWordSize(normalizedContribution)} ${getTextColor(wc.contribution)}`}>
                {wc.word}
              </span>
              {!wc.isInVocabulary && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-gray-400 rounded-full" title="未登录词" />
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          详细贡献列表 (按影响排序)
        </h3>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {contributions.slice(0, 20).map((wc, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                hoveredWord === wc.word ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getWordColor(wc.contribution)}`}>
                  {index + 1}
                </span>
                <span className="font-medium text-gray-800">{wc.word}</span>
                {!wc.isInVocabulary && (
                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">未登录</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-sm font-bold ${getTextColor(wc.contribution)}`}>
                    {wc.contribution > 0 ? '+' : ''}{wc.contribution.toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-500">贡献值</div>
                </div>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  {wc.contribution > 0 ? (
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full ml-auto"
                      style={{ width: `${Math.min(100, Math.abs(wc.contribution) * 100)}%` }}
                    />
                  ) : (
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.abs(wc.contribution) * 100)}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hoveredWord && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="text-sm text-blue-700">
            <span className="font-semibold">"{hoveredWord}"</span> 的详细概率信息将在悬停时显示
          </div>
        </div>
      )}
    </div>
  );
};
