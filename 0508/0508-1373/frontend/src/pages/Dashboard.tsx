import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { testAPI } from '../services/api';
import { TestCard } from '../components/TestCard';
import { MetricsChart } from '../components/MetricsChart';
import { CreateTestForm } from '../components/CreateTestForm';
import type {
  LoadTest,
  LoadTestConfig,
  AggregatedMetrics,
  WorkerStatus,
} from '../types';

export const Dashboard: React.FC = () => {
  const {
    tests,
    metrics,
    selectedTestId,
    isConnected,
    setTests,
    addTest,
    updateTest,
    setSelectedTestId,
    addMetrics,
    updateWorkerStatus,
    setIsConnected,
  } = useStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [scaleCount, setScaleCount] = useState(5);
  const [currentScalingTest, setCurrentScalingTest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleMessage = useCallback(
    (data: any) => {
      if ('status' in data && 'id' in data && 'config' in data) {
        updateTest(data as LoadTest);
      } else if ('test_id' in data && 'actual_qps' in data) {
        addMetrics(data as AggregatedMetrics);
      } else if ('id' in data && 'current_qps' in data && !('config' in data)) {
        updateWorkerStatus(data as WorkerStatus);
      }
    },
    [updateTest, addMetrics, updateWorkerStatus]
  );

  useWebSocket('/ws', {
    onMessage: handleMessage,
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
  });

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const data = await testAPI.list();
        setTests(data);
      } catch (e) {
        console.error('Failed to fetch tests:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, [setTests]);

  const handleCreateTest = async (config: LoadTestConfig) => {
    try {
      const test = await testAPI.create(config);
      addTest(test);
      setShowCreateForm(false);
    } catch (e) {
      console.error('Failed to create test:', e);
      alert('创建压测任务失败');
    }
  };

  const handleStopTest = async (id: string) => {
    if (confirm('确定要停止这个压测任务吗？')) {
      try {
        await testAPI.stop(id);
      } catch (e) {
        console.error('Failed to stop test:', e);
      }
    }
  };

  const handleScale = async (testId: string) => {
    try {
      await testAPI.scale(testId, scaleCount);
      setShowScaleModal(false);
      setCurrentScalingTest(null);
    } catch (e) {
      console.error('Failed to scale workers:', e);
      alert('扩缩容失败');
    }
  };

  const handleViewReport = async (id: string) => {
    try {
      const result = await testAPI.generateReport(id);
      window.open(result.report_path, '_blank');
    } catch (e) {
      console.error('Failed to generate report:', e);
      alert('生成报告失败');
    }
  };

  const selectedTest = tests.find((t) => t.id === selectedTestId);
  const selectedMetrics = selectedTestId ? metrics[selectedTestId] || [] : [];

  const latestMetrics = selectedMetrics.length > 0
    ? selectedMetrics[selectedMetrics.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-dark-700">
      <main className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">压测仪表盘</h1>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                isConnected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {isConnected ? '● 已连接' : '● 断开连接'}
            </span>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            + 创建压测
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-white">压测任务</h2>
            {loading ? (
              <div className="text-dark-300 text-center py-8">加载中...</div>
            ) : tests.length === 0 ? (
              <div className="bg-dark-600 rounded-lg p-8 text-center">
                <p className="text-dark-300 mb-4">暂无压测任务</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-primary-400 hover:text-primary-300"
                >
                  创建第一个压测任务
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {tests.map((test) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    selected={selectedTestId === test.id}
                    onClick={() => setSelectedTestId(test.id)}
                    onStop={() => handleStopTest(test.id)}
                    onScale={() => {
                      setCurrentScalingTest(test.id);
                      setScaleCount(test.config.worker_count);
                      setShowScaleModal(true);
                    }}
                    onViewReport={() => handleViewReport(test.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedTest && latestMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-600 rounded-lg p-4">
                  <p className="text-dark-300 text-sm">实际QPS</p>
                  <p className="text-2xl font-bold text-white">
                    {latestMetrics.actual_qps.toFixed(1)}
                  </p>
                </div>
                <div className="bg-dark-600 rounded-lg p-4">
                  <p className="text-dark-300 text-sm">错误率</p>
                  <p
                    className={`text-2xl font-bold ${
                      latestMetrics.error_rate > 5
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {latestMetrics.error_rate.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-dark-600 rounded-lg p-4">
                  <p className="text-dark-300 text-sm">TTFT P95</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {(latestMetrics.ttft_percentiles?.P95 || 0).toFixed(1)}ms
                  </p>
                </div>
                <div className="bg-dark-600 rounded-lg p-4">
                  <p className="text-dark-300 text-sm">TPOT P95</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {(latestMetrics.tpot_percentiles?.P95 || 0).toFixed(2)}ms
                  </p>
                </div>
              </div>
            )}

            {selectedMetrics.length > 0 ? (
              <div className="space-y-6">
                <MetricsChart metrics={selectedMetrics} type="qps" title="QPS 趋势" />
                <MetricsChart
                  metrics={selectedMetrics}
                  type="latency"
                  title="延迟趋势 (P95)"
                />
                <MetricsChart
                  metrics={selectedMetrics}
                  type="error"
                  title="错误率趋势"
                />
              </div>
            ) : selectedTest ? (
              <div className="bg-dark-600 rounded-lg p-8 text-center">
                <p className="text-dark-300">等待指标数据...</p>
              </div>
            ) : (
              <div className="bg-dark-600 rounded-lg p-8 text-center">
                <p className="text-dark-300">选择一个压测任务查看实时指标</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateForm && (
        <CreateTestForm
          onSubmit={handleCreateTest}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {showScaleModal && currentScalingTest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-600 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">调整Worker数量</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Worker 数量
              </label>
              <input
                type="number"
                value={scaleCount}
                onChange={(e) => setScaleCount(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowScaleModal(false);
                  setCurrentScalingTest(null);
                }}
                className="px-4 py-2 bg-dark-500 hover:bg-dark-400 text-white rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => handleScale(currentScalingTest)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
