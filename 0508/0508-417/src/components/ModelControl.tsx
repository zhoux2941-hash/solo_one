import React, { useState } from 'react';
import { Settings, RotateCcw, AlertCircle, TrendingUp, Database, X, Check, SlidersHorizontal, Users, AlertTriangle } from 'lucide-react';

interface ModelControlProps {
  accuracy: number;
  userSampleCount: { spam: number; ham: number };
  totalSampleCount: { spam: number; ham: number; total: number };
  vocabularySize: number;
  hasResult: boolean;
  userWeight: number;
  onMislabel: (correctLabel: 'spam' | 'ham') => void;
  onReset: () => void;
  onWeightChange: (weight: number) => void;
}

export const ModelControl: React.FC<ModelControlProps> = ({
  accuracy,
  userSampleCount,
  totalSampleCount,
  vocabularySize,
  hasResult,
  userWeight,
  onMislabel,
  onReset,
  onWeightChange,
}) => {
  const [showMislabelDialog, setShowMislabelDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleMislabelConfirm = (label: 'spam' | 'ham') => {
    onMislabel(label);
    setShowMislabelDialog(false);
  };

  const handleResetConfirm = () => {
    onReset();
    setShowResetConfirm(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">模型控制</h2>
          <p className="text-sm text-gray-500">管理训练集和查看模型状态</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 text-center border border-blue-100">
          <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-blue-600">{Math.round(accuracy * 100)}%</div>
          <div className="text-[10px] text-blue-600">准确率</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center border border-green-100">
          <Database className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-600">{vocabularySize}</div>
          <div className="text-[10px] text-green-600">词汇量</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 text-center border border-orange-100">
          <Users className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-orange-600">{totalSampleCount.total}</div>
          <div className="text-[10px] text-orange-600">总样本</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center border border-purple-100">
          <AlertCircle className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-purple-600">{userSampleCount.spam + userSampleCount.ham}</div>
          <div className="text-[10px] text-purple-600">用户样本</div>
        </div>
      </div>

      <div className={`mb-4 p-3 rounded-xl border ${
        userSampleCount.spam + userSampleCount.ham < 5
          ? 'bg-amber-50 border-amber-200'
          : userSampleCount.spam + userSampleCount.ham < 10
          ? 'bg-blue-50 border-blue-200'
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-start gap-2">
          {userSampleCount.spam + userSampleCount.ham < 5 ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          ) : userSampleCount.spam + userSampleCount.ham < 10 ? (
            <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          ) : (
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            {userSampleCount.spam + userSampleCount.ham < 5 ? (
              <>
                <span className="font-semibold text-amber-700">样本数量不足</span>
                <p className="text-amber-600 mt-0.5">建议至少添加 5-10 个用户标注样本，模型才能有效学习您的分类偏好。</p>
              </>
            ) : userSampleCount.spam + userSampleCount.ham < 10 ? (
              <>
                <span className="font-semibold text-blue-700">正在学习中</span>
                <p className="text-blue-600 mt-0.5">已有 {userSampleCount.spam + userSampleCount.ham} 个样本，继续添加更多样本可进一步提升准确率。</p>
              </>
            ) : (
              <>
                <span className="font-semibold text-green-700">样本充足</span>
                <p className="text-green-600 mt-0.5">已有 {userSampleCount.spam + userSampleCount.ham} 个用户样本，模型已具备良好的个性化分类能力。</p>
              </>
            )}
          </div>
        </div>
      </div>

      {(userSampleCount.spam > 0 || userSampleCount.ham > 0) && (
        <div className="mb-6 p-3 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-2">用户训练样本分布</div>
          <div className="flex h-2 rounded-full overflow-hidden">
            <div 
              className="bg-red-400 transition-all duration-500"
              style={{ width: `${(userSampleCount.spam / (userSampleCount.spam + userSampleCount.ham)) * 100}%` }}
            />
            <div 
              className="bg-green-400 transition-all duration-500"
              style={{ width: `${(userSampleCount.ham / (userSampleCount.spam + userSampleCount.ham)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-red-500">垃圾: {userSampleCount.spam}</span>
            <span className="text-green-500">正常: {userSampleCount.ham}</span>
          </div>
        </div>
      )}

      <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-indigo-700">用户训练集权重</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-indigo-400 w-6 text-right">0%</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={userWeight}
              onChange={(e) => onWeightChange(Number(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-indigo-300">忽略</span>
              <span className="text-[10px] text-indigo-400">标准</span>
              <span className="text-[10px] text-indigo-300">最大</span>
            </div>
          </div>
          <span className="text-xs text-indigo-400 w-8">100%</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-indigo-500">
            当前: <strong className="text-indigo-700">{userWeight}%</strong> · 倍率: <strong className="text-indigo-700">{(userWeight / 50).toFixed(1)}x</strong>
          </span>
          <button
            onClick={() => onWeightChange(50)}
            className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors"
          >
            重置
          </button>
        </div>
        <p className="text-[11px] text-indigo-400 mt-2 leading-relaxed">
          控制用户添加的训练样本对分类结果的影响力。0%=忽略用户样本，50%=标准权重(1x)，100%=双倍权重(2x)。
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setShowMislabelDialog(true)}
          disabled={!hasResult}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
        >
          <AlertCircle className="w-5 h-5" />
          报告误判
        </button>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
        >
          <RotateCcw className="w-5 h-5" />
          重置训练集
        </button>
      </div>

      {showMislabelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">报告误判</h3>
              <button
                onClick={() => setShowMislabelDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              请选择这封邮件的正确类别，系统将把它加入训练集并重新训练模型。
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleMislabelConfirm('spam')}
                className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl hover:border-red-400 transition-all duration-200 hover:shadow-md"
              >
                <span className="text-3xl mb-2">🚨</span>
                <span className="font-bold text-red-600">垃圾邮件</span>
                <span className="text-xs text-red-500 mt-1">应该被标记为垃圾</span>
              </button>
              <button
                onClick={() => handleMislabelConfirm('ham')}
                className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:border-green-400 transition-all duration-200 hover:shadow-md"
              >
                <span className="text-3xl mb-2">✅</span>
                <span className="font-bold text-green-600">正常邮件</span>
                <span className="text-xs text-green-500 mt-1">应该被标记为正常</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">确认重置</h3>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-700">此操作不可撤销</p>
                  <p className="text-sm text-amber-600 mt-1">
                    将删除所有用户添加的训练样本，恢复到预置训练集状态。
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
              >
                <X className="w-5 h-5" />
                取消
              </button>
              <button
                onClick={handleResetConfirm}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Check className="w-5 h-5" />
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
