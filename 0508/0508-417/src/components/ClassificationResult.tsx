import React from 'react';
import { AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { ClassificationResult as ClassificationResultType } from '../types/classifier';

interface ClassificationResultProps {
  result: ClassificationResultType | null;
}

export const ClassificationResult: React.FC<ClassificationResultProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">分类结果</h2>
            <p className="text-sm text-gray-500">输入邮件后将显示分析结果</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Target className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-center">等待输入邮件进行分类</p>
        </div>
      </div>
    );
  }

  const spamPercent = Math.round(result.spamProbability * 100);
  const hamPercent = Math.round(result.hamProbability * 100);
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          result.isSpam 
            ? 'bg-gradient-to-br from-red-500 to-orange-500' 
            : 'bg-gradient-to-br from-green-500 to-emerald-500'
        }`}>
          {result.isSpam ? (
            <AlertTriangle className="w-5 h-5 text-white" />
          ) : (
            <CheckCircle className="w-5 h-5 text-white" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">分类结果</h2>
          <p className="text-sm text-gray-500">基于朴素贝叶斯算法分析</p>
        </div>
      </div>

      <div className={`text-center py-6 rounded-xl mb-6 ${
        result.isSpam 
          ? 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200' 
          : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
      }`}>
        <div className={`text-3xl font-bold mb-2 ${
          result.isSpam ? 'text-red-600' : 'text-green-600'
        }`}>
          {result.isSpam ? '🚨 垃圾邮件' : '✅ 正常邮件'}
        </div>
        <div className="text-sm text-gray-600">
          置信度: <span className="font-semibold">{confidencePercent}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-red-600 font-medium">垃圾邮件概率</span>
            <span className="text-red-600 font-bold">{spamPercent}%</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${spamPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-600 font-medium">正常邮件概率</span>
            <span className="text-green-600 font-bold">{hamPercent}%</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${hamPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-800">{result.wordContributions.length}</div>
            <div className="text-xs text-gray-500">识别特征词</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-800">
              {result.wordContributions.filter(w => w.isInVocabulary).length}
            </div>
            <div className="text-xs text-gray-500">词汇表匹配</div>
          </div>
        </div>
      </div>
    </div>
  );
};
