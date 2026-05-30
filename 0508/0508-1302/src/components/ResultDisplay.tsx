import React from 'react';
import { BayesianResult, DisplayFormat, BayesianParams } from '../types';
import { formatProbability, formatNumber } from '../utils/formatters';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface ResultDisplayProps {
  params: BayesianParams;
  result: BayesianResult;
  displayFormat: DisplayFormat;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  params,
  result,
  displayFormat,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
        计算结果
      </h2>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 text-center">
        <p className="text-sm text-slate-600 mb-2">检测阳性时的患病概率</p>
        <div className="flex items-center justify-center gap-3">
          <TrendingUp className="w-8 h-8 text-emerald-500" />
          <span className="text-5xl font-bold text-emerald-600">
            {formatProbability(result.posteriorProbability)}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          先验概率: {formatProbability(params.priorProbability)} → 
          后验概率: {formatProbability(result.posteriorProbability)}
        </p>
      </div>

      {displayFormat === 'frequency' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <AlertCircle className="w-4 h-4" />
            <span>以 {formatNumber(result.totalPopulation)} 人为例</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <p className="text-xs text-red-600 font-medium">真阳性</p>
              <p className="text-2xl font-bold text-red-700">
                {formatNumber(result.truePositives)}
              </p>
              <p className="text-xs text-red-500">患病且检测阳性</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <p className="text-xs text-orange-600 font-medium">假阳性</p>
              <p className="text-2xl font-bold text-orange-700">
                {formatNumber(result.falsePositives)}
              </p>
              <p className="text-xs text-orange-500">未患病但检测阳性</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <p className="text-xs text-green-600 font-medium">真阴性</p>
              <p className="text-2xl font-bold text-green-700">
                {formatNumber(result.trueNegatives)}
              </p>
              <p className="text-xs text-green-500">未患病且检测阴性</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <p className="text-xs text-amber-600 font-medium">假阴性</p>
              <p className="text-2xl font-bold text-amber-700">
                {formatNumber(result.falseNegatives)}
              </p>
              <p className="text-xs text-amber-500">患病但检测阴性</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              检测阳性总人数：
              <span className="font-bold text-slate-900">
                {formatNumber(result.truePositives + result.falsePositives)}
              </span>
              人，其中真阳性占 
              <span className="font-bold text-emerald-600">
                {formatProbability(result.posteriorProbability)}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
