import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ErrorMessage: React.FC = () => {
  const { error, setError } = useAppStore();

  if (!error) return null;

  const isWarning = error.includes('成功解析') && error.includes('跳过');

  return (
    <div
      className={`rounded-xl p-4 flex items-start gap-3 ${
        isWarning ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
      }`}
    >
      <AlertCircle
        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
          isWarning ? 'text-yellow-600' : 'text-red-600'
        }`}
      />
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            isWarning ? 'text-yellow-800' : 'text-red-800'
          }`}
        >
          {isWarning ? '提示' : '错误'}
        </p>
        <p
          className={`text-sm mt-1 ${
            isWarning ? 'text-yellow-700' : 'text-red-700'
          }`}
        >
          {error}
        </p>
      </div>
      <button
        onClick={() => setError(null)}
        className={`p-1 rounded-lg transition-colors ${
          isWarning
            ? 'text-yellow-500 hover:bg-yellow-100'
            : 'text-red-500 hover:bg-red-100'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
