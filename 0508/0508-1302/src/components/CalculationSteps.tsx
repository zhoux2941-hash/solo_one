import React, { useState } from 'react';
import { CalculationStep } from '../types';
import { formatProbability, formatDecimal } from '../utils/formatters';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';

interface CalculationStepsProps {
  steps: CalculationStep[];
}

export const CalculationSteps: React.FC<CalculationStepsProps> = ({ steps }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
          贝叶斯公式计算过程
        </h2>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-slate-500" />
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-6 space-y-4">
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-purple-800 mb-2">贝叶斯定理公式：</p>
            <p className="text-lg font-mono text-purple-900 text-center">
              P(A|B) = P(B|A) × P(A) / P(B)
            </p>
            <p className="text-xs text-purple-600 mt-2 text-center">
              P(患病|阳性) = P(阳性|患病) × P(患病) / P(阳性)
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  index === steps.length - 1
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    index === steps.length - 1
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-mono text-sm text-slate-800 font-medium">
                      {step.formula}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {step.description}
                    </p>
                    <p className="text-lg font-bold mt-2 text-slate-900">
                      = {formatDecimal(step.value, 6)}
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        ({formatProbability(step.value)})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800">
              💡 结论：检测结果为阳性时，实际患病的概率为
              <span className="font-bold text-blue-900 mx-1">
                {formatProbability(steps[steps.length - 1].value)}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
