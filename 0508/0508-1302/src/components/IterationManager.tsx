import React from 'react';
import { TestResult, DisplayFormat, BayesianParams } from '../types';
import { formatProbability, formatNumber } from '../utils/formatters';
import { Plus, Trash2, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface IterationManagerProps {
  testResults: TestResult[];
  testResultForIteration: 'positive' | 'negative';
  currentPrior: number;
  params: BayesianParams;
  displayFormat: DisplayFormat;
  onTestResultChange: (result: 'positive' | 'negative') => void;
  onAddTest: () => void;
  onRemoveTest: (testId: string) => void;
  onClearTests: () => void;
  onReset: () => void;
}

export const IterationManager: React.FC<IterationManagerProps> = ({
  testResults,
  testResultForIteration,
  currentPrior,
  params,
  displayFormat,
  onTestResultChange,
  onAddTest,
  onRemoveTest,
  onClearTests,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
        贝叶斯更新迭代
      </h2>

      <div className="bg-indigo-50 rounded-lg p-4">
        <p className="text-sm text-indigo-800">
          <strong>当前先验概率：</strong>
          <span className="text-lg font-bold text-indigo-900 ml-2">
            {formatProbability(currentPrior)}
          </span>
        </p>
        {testResults.length > 0 && (
          <p className="text-xs text-indigo-600 mt-1">
            已完成 {testResults.length} 次检测，可继续添加新的检测结果
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex rounded-lg bg-slate-100 p-1 flex-1 min-w-[200px]">
          <button
            onClick={() => onTestResultChange('positive')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              testResultForIteration === 'positive'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            检测阳性
          </button>
          <button
            onClick={() => onTestResultChange('negative')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              testResultForIteration === 'negative'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <XCircle className="w-4 h-4" />
            检测阴性
          </button>
        </div>

        <button
          onClick={onAddTest}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          添加检测
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClearTests}
          disabled={testResults.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          清除检测记录
        </button>
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          重置所有
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">检测历史</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {testResults.map((test, index) => (
              <div
                key={test.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:border-slate-300 transition-all"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  test.testResult === 'positive' 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  <span className="text-sm font-bold">{test.testNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      test.testResult === 'positive' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {test.testResult === 'positive' ? '阳性' : '阴性'}
                    </span>
                    <span className="text-xs text-slate-400">
                      先验: {formatProbability(test.params.priorProbability)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">后验:</span>
                    <span className="font-bold text-slate-700">
                      {formatProbability(test.result.posteriorProbability)}
                    </span>
                    {displayFormat === 'frequency' && (
                      <span className="text-xs text-slate-400">
                        ({formatNumber(test.result.truePositives)}真阳性 / {formatNumber(test.result.truePositives + test.result.falsePositives)}阳性)
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveTest(test.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-4 text-white">
          <p className="text-sm opacity-90">当前综合后验概率</p>
          <p className="text-3xl font-bold">
            {formatProbability(testResults[testResults.length - 1].result.posteriorProbability)}
          </p>
          <p className="text-xs opacity-80 mt-1">
            经过 {testResults.length} 次检测更新
          </p>
        </div>
      )}
    </div>
  );
};
