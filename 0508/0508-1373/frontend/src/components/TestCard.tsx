import React from 'react';
import type { LoadTest } from '../types';

interface TestCardProps {
  test: LoadTest;
  selected: boolean;
  onClick: () => void;
  onStop?: () => void;
  onScale?: () => void;
  onViewReport?: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  running: 'bg-green-500/20 text-green-400 animate-pulse',
  paused: 'bg-orange-500/20 text-orange-400',
  completed: 'bg-blue-500/20 text-blue-400',
  failed: 'bg-red-500/20 text-red-400',
  stopped: 'bg-gray-500/20 text-gray-400',
};

const modeLabels: Record<string, string> = {
  fixed_qps: '固定QPS',
  linear_growth: '线性增长',
  burst: '突发流量',
  replay: '真实回放',
};

export const TestCard: React.FC<TestCardProps> = ({
  test,
  selected,
  onClick,
  onStop,
  onScale,
  onViewReport,
}) => {
  const isRunning = test.status === 'running';
  const isFinished = ['completed', 'failed', 'stopped'].includes(test.status);

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg cursor-pointer transition-all ${
        selected
          ? 'bg-primary-700 ring-2 ring-primary-500'
          : 'bg-dark-600 hover:bg-dark-500'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{test.config.name}</h3>
          <p className="text-sm text-dark-200 truncate">{test.config.target_url}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
            statusColors[test.status]
          }`}
        >
          {test.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-dark-300">模式:</span>{' '}
          <span className="text-dark-100">{modeLabels[test.config.mode]}</span>
        </div>
        <div>
          <span className="text-dark-300">Workers:</span>{' '}
          <span className="text-dark-100">{test.config.worker_count}</span>
        </div>
        <div>
          <span className="text-dark-300">时长:</span>{' '}
          <span className="text-dark-100">{test.config.duration_seconds}s</span>
        </div>
        {test.config.fixed_qps && (
          <div>
            <span className="text-dark-300">目标QPS:</span>{' '}
            <span className="text-dark-100">{test.config.fixed_qps}</span>
          </div>
        )}
      </div>

      <div className="text-xs text-dark-300 mb-3">
        创建于 {new Date(test.created_at).toLocaleString()}
      </div>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {isRunning && (
          <>
            <button
              onClick={onScale}
              className="flex-1 px-3 py-1.5 text-sm bg-dark-500 hover:bg-dark-400 text-dark-100 rounded transition-colors"
            >
              扩缩容
            </button>
            <button
              onClick={onStop}
              className="flex-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              停止
            </button>
          </>
        )}
        {isFinished && (
          <button
            onClick={onViewReport}
            className="flex-1 px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
          >
            查看报告
          </button>
        )}
      </div>
    </div>
  );
};
