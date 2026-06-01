import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { abTestAPI } from '../services/api';
import type {
  ABTestConfig,
  ABTestResult,
  LoadTestConfig,
  LoadTestMode,
  CompletionType,
} from '../types';

const defaultTestConfig: LoadTestConfig = {
  name: '',
  target_url: '',
  api_key: '',
  completion_type: 'chat_completion',
  mode: 'fixed_qps',
  duration_seconds: 300,
  worker_count: 5,
  fixed_qps: 100,
  linear_start_qps: 10,
  linear_end_qps: 100,
  burst_multiplier: 3,
  burst_at_seconds: 60,
  replay_speed: 1.0,
  request_timeout_seconds: 120,
  max_retries: 3,
  model: 'gpt-4',
};

export const ABTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { abTests, addABTest, updateABTest, setABTests } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedABTestId, setSelectedABTestId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    config_a: LoadTestConfig;
    config_b: LoadTestConfig;
  }>({
    name: '',
    description: '',
    config_a: { ...defaultTestConfig, name: '版本A' },
    config_b: { ...defaultTestConfig, name: '版本B' },
  });

  useEffect(() => {
    const fetchABTests = async () => {
      try {
        const response = await fetch('/api/v1/ab-tests');
        if (response.ok) {
          const data = await response.json();
          setABTests(data);
        }
      } catch (e) {
        console.error('Failed to fetch AB tests:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchABTests();
  }, [setABTests]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    version?: 'config_a' | 'config_b'
  ) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;

    if (version) {
      setFormData((prev) => ({
        ...prev,
        [version]: {
          ...prev[version],
          [name]: parsedValue,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    }
  };

  const handleSyncModeConfig = () => {
    setFormData((prev) => ({
      ...prev,
      config_b: {
        ...prev.config_b,
        mode: prev.config_a.mode,
        duration_seconds: prev.config_a.duration_seconds,
        worker_count: prev.config_a.worker_count,
        fixed_qps: prev.config_a.fixed_qps,
        linear_start_qps: prev.config_a.linear_start_qps,
        linear_end_qps: prev.config_a.linear_end_qps,
        burst_multiplier: prev.config_a.burst_multiplier,
        burst_at_seconds: prev.config_a.burst_at_seconds,
        replay_speed: prev.config_a.replay_speed,
        completion_type: prev.config_a.completion_type,
        request_timeout_seconds: prev.config_a.request_timeout_seconds,
        max_retries: prev.config_a.max_retries,
        model: prev.config_a.model,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config: ABTestConfig = {
        id: '',
        name: formData.name,
        description: formData.description,
        config_a: formData.config_a,
        config_b: formData.config_b,
        created_at: new Date().toISOString(),
      };
      const result = await abTestAPI.create(config);
      addABTest(result);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        config_a: { ...defaultTestConfig, name: '版本A' },
        config_b: { ...defaultTestConfig, name: '版本B' },
      });
    } catch (e) {
      console.error('Failed to create AB test:', e);
      alert('创建A/B测试失败');
    }
  };

  const handleViewReport = async (id: string) => {
    try {
      const result = await abTestAPI.generateReport(id);
      window.open(result.report_path, '_blank');
    } catch (e) {
      console.error('Failed to generate AB test report:', e);
      alert('生成A/B测试报告失败');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'pending':
        return '等待中';
      default:
        return status;
    }
  };

  const selectedABTest = abTests.find((t) => t.id === selectedABTestId);

  const renderComparisonCard = (
    label: string,
    valueA: number | undefined,
    valueB: number | undefined,
    unit: string,
    isLowerBetter: boolean = false
  ) => {
    if (valueA === undefined || valueB === undefined) return null;

    const diff = valueB - valueA;
    const pctDiff = valueA > 0 ? ((diff / valueA) * 100).toFixed(1) : '0';
    const isBetter = isLowerBetter ? diff < 0 : diff > 0;
    const isSame = Math.abs(diff) < 0.001;

    return (
      <div className="bg-dark-600 rounded-lg p-4">
        <p className="text-dark-300 text-sm mb-2">{label}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-dark-400">A</p>
            <p className="text-lg font-semibold text-white">
              {valueA.toFixed(2)}{unit}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-dark-400">差异</p>
            <p
              className={`text-lg font-bold ${
                isSame
                  ? 'text-dark-300'
                  : isBetter
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {isSame ? '-' : `${parseFloat(pctDiff) > 0 ? '+' : ''}${pctDiff}%`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-dark-400">B</p>
            <p className="text-lg font-semibold text-white">
              {valueB.toFixed(2)}{unit}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-700">
      <main className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 bg-dark-600 hover:bg-dark-500 text-dark-200 rounded-lg transition-colors text-sm"
            >
              ← 返回仪表盘
            </button>
            <h1 className="text-2xl font-bold text-white">A/B 对比测试</h1>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            + 创建A/B测试
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-white">A/B测试列表</h2>
            {loading ? (
              <div className="text-dark-300 text-center py-8">加载中...</div>
            ) : abTests.length === 0 ? (
              <div className="bg-dark-600 rounded-lg p-8 text-center">
                <p className="text-dark-300 mb-4">暂无A/B测试任务</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-primary-400 hover:text-primary-300"
                >
                  创建第一个A/B测试
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {abTests.map((test) => (
                  <div
                    key={test.id}
                    onClick={() => setSelectedABTestId(test.id)}
                    className={`bg-dark-600 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedABTestId === test.id
                        ? 'ring-2 ring-primary-500'
                        : 'hover:bg-dark-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white">{test.config.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                          test.status
                        )}`}
                      >
                        {getStatusText(test.status)}
                      </span>
                    </div>
                    {test.config.description && (
                      <p className="text-sm text-dark-300 mb-2">
                        {test.config.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-dark-400">
                      <span>
                        A: {test.config.config_a.target_url}
                      </span>
                      <span>
                        B: {test.config.config_b.target_url}
                      </span>
                    </div>
                    {test.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewReport(test.id);
                        }}
                        className="mt-3 w-full py-1.5 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded text-sm transition-colors"
                      >
                        查看对比报告
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedABTest ? (
              <>
                <div className="bg-dark-600 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {selectedABTest.config.name}
                  </h3>
                  {selectedABTest.config.description && (
                    <p className="text-dark-300 mb-4">
                      {selectedABTest.config.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dark-700 rounded-lg p-4">
                      <p className="text-sm font-medium text-primary-400 mb-2">
                        版本A - {selectedABTest.config.config_a.name}
                      </p>
                      <p className="text-sm text-dark-300">
                        URL: {selectedABTest.config.config_a.target_url}
                      </p>
                      <p className="text-sm text-dark-300">
                        模式: {selectedABTest.config.config_a.mode}
                      </p>
                      <p className="text-sm text-dark-300">
                        时长: {selectedABTest.config.config_a.duration_seconds}秒
                      </p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-400 mb-2">
                        版本B - {selectedABTest.config.config_b.name}
                      </p>
                      <p className="text-sm text-dark-300">
                        URL: {selectedABTest.config.config_b.target_url}
                      </p>
                      <p className="text-sm text-dark-300">
                        模式: {selectedABTest.config.config_b.mode}
                      </p>
                      <p className="text-sm text-dark-300">
                        时长: {selectedABTest.config.config_b.duration_seconds}秒
                      </p>
                    </div>
                  </div>
                </div>

                {selectedABTest.result_a && selectedABTest.result_b && (
                  <>
                    <h3 className="text-lg font-semibold text-white">性能对比</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderComparisonCard(
                        '平均QPS',
                        selectedABTest.result_a.average_qps,
                        selectedABTest.result_b.average_qps,
                        '',
                        false
                      )}
                      {renderComparisonCard(
                        '错误率',
                        selectedABTest.result_a.error_rate,
                        selectedABTest.result_b.error_rate,
                        '%',
                        true
                      )}
                      {renderComparisonCard(
                        'TTFT P95',
                        selectedABTest.result_a.ttft.p95,
                        selectedABTest.result_b.ttft.p95,
                        'ms',
                        true
                      )}
                      {renderComparisonCard(
                        'TPOT P95',
                        selectedABTest.result_a.tpot.p95,
                        selectedABTest.result_b.tpot.p95,
                        'ms',
                        true
                      )}
                      {renderComparisonCard(
                        '总延迟 P95',
                        selectedABTest.result_a.total_latency.p95,
                        selectedABTest.result_b.total_latency.p95,
                        'ms',
                        true
                      )}
                    </div>

                    {selectedABTest.comparison && (
                      <div className="bg-dark-600 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          综合评分
                        </h3>
                        <div className="text-center">
                          <p className="text-4xl font-bold mb-2">
                            {selectedABTest.comparison.is_better === 'B' ? (
                              <span className="text-green-400">版本 B 更优 ✓</span>
                            ) : selectedABTest.comparison.is_better === 'A' ? (
                              <span className="text-primary-400">版本 A 更优 ✓</span>
                            ) : (
                              <span className="text-yellow-400">性能相当</span>
                            )}
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-6">
                            <div>
                              <p className="text-sm text-dark-400">QPS 提升</p>
                              <p
                                className={`text-xl font-bold ${
                                  selectedABTest.comparison.qps_difference_pct >= 0
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {selectedABTest.comparison.qps_difference_pct >= 0
                                  ? '+'
                                  : ''}
                                {selectedABTest.comparison.qps_difference_pct.toFixed(
                                  1
                                )}
                                %
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-dark-400">TTFT 改善</p>
                              <p
                                className={`text-xl font-bold ${
                                  selectedABTest.comparison.ttft_p95_improvement_pct >=
                                  0
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {selectedABTest.comparison.ttft_p95_improvement_pct >=
                                0
                                  ? '+'
                                  : ''}
                                {selectedABTest.comparison.ttft_p95_improvement_pct.toFixed(
                                  1
                                )}
                                %
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-dark-400">TPOT 改善</p>
                              <p
                                className={`text-xl font-bold ${
                                  selectedABTest.comparison.tpot_p95_improvement_pct >=
                                  0
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {selectedABTest.comparison.tpot_p95_improvement_pct >=
                                0
                                  ? '+'
                                  : ''}
                                {selectedABTest.comparison.tpot_p95_improvement_pct.toFixed(
                                  1
                                )}
                                %
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedABTest.status === 'completed' && (
                  <button
                    onClick={() => handleViewReport(selectedABTest.id)}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    生成完整对比报告
                  </button>
                )}
              </>
            ) : (
              <div className="bg-dark-600 rounded-lg p-8 text-center">
                <p className="text-dark-300">选择一个A/B测试查看详情</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-600 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-500">
              <h2 className="text-xl font-semibold text-white">创建A/B对比测试</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    测试名称 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleChange(e)}
                    required
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="例如: v1.0 vs v1.1 性能对比"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    描述
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={(e) => handleChange(e)}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="简要描述测试目的"
                  />
                </div>
              </div>

              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-white">公共压测配置</h3>
                  <button
                    type="button"
                    onClick={handleSyncModeConfig}
                    className="text-sm text-primary-400 hover:text-primary-300"
                  >
                    同步A的配置到B
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      接口类型 *
                    </label>
                    <select
                      name="completion_type"
                      value={formData.config_a.completion_type}
                      onChange={(e) => handleChange(e, 'config_a')}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="chat_completion">Chat Completion</option>
                      <option value="text_completion">Text Completion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      压测模式 *
                    </label>
                    <select
                      name="mode"
                      value={formData.config_a.mode}
                      onChange={(e) => handleChange(e, 'config_a')}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="fixed_qps">固定QPS模式</option>
                      <option value="linear_growth">线性增长模式</option>
                      <option value="burst">突发流量模式</option>
                      <option value="replay">真实回放模式</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      压测时长 (秒) *
                    </label>
                    <input
                      type="number"
                      name="duration_seconds"
                      value={formData.config_a.duration_seconds}
                      onChange={(e) => handleChange(e, 'config_a')}
                      min="10"
                      max="7200"
                      required
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Worker数量 *
                    </label>
                    <input
                      type="number"
                      name="worker_count"
                      value={formData.config_a.worker_count}
                      onChange={(e) => handleChange(e, 'config_a')}
                      min="1"
                      max="100"
                      required
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      模型名称
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.config_a.model}
                      onChange={(e) => handleChange(e, 'config_a')}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      请求超时 (秒)
                    </label>
                    <input
                      type="number"
                      name="request_timeout_seconds"
                      value={formData.config_a.request_timeout_seconds}
                      onChange={(e) => handleChange(e, 'config_a')}
                      min="1"
                      max="300"
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {formData.config_a.mode === 'fixed_qps' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      目标QPS *
                    </label>
                    <input
                      type="number"
                      name="fixed_qps"
                      value={formData.config_a.fixed_qps}
                      onChange={(e) => handleChange(e, 'config_a')}
                      min="1"
                      max="10000"
                      required
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {formData.config_a.mode === 'linear_growth' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1">
                        起始QPS *
                      </label>
                      <input
                        type="number"
                        name="linear_start_qps"
                        value={formData.config_a.linear_start_qps}
                        onChange={(e) => handleChange(e, 'config_a')}
                        min="1"
                        required
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1">
                        结束QPS *
                      </label>
                      <input
                        type="number"
                        name="linear_end_qps"
                        value={formData.config_a.linear_end_qps}
                        onChange={(e) => handleChange(e, 'config_a')}
                        min="1"
                        required
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {formData.config_a.mode === 'burst' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1">
                        基础QPS *
                      </label>
                      <input
                        type="number"
                        name="fixed_qps"
                        value={formData.config_a.fixed_qps}
                        onChange={(e) => handleChange(e, 'config_a')}
                        min="1"
                        required
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1">
                        突发倍数 *
                      </label>
                      <input
                        type="number"
                        name="burst_multiplier"
                        value={formData.config_a.burst_multiplier}
                        onChange={(e) => handleChange(e, 'config_a')}
                        min="1.5"
                        step="0.5"
                        required
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1">
                        突发时间点 (秒) *
                      </label>
                      <input
                        type="number"
                        name="burst_at_seconds"
                        value={formData.config_a.burst_at_seconds}
                        onChange={(e) => handleChange(e, 'config_a')}
                        min="1"
                        required
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-primary-400">版本A配置</h3>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      版本名称
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.config_a.name}
                      onChange={(e) => handleChange(e, 'config_a')}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      目标URL *
                    </label>
                    <input
                      type="url"
                      name="target_url"
                      value={formData.config_a.target_url}
                      onChange={(e) => handleChange(e, 'config_a')}
                      required
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      name="api_key"
                      value={formData.config_a.api_key}
                      onChange={(e) => handleChange(e, 'config_a')}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="sk-..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-medium text-green-400">版本B配置</h3>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      版本名称
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.config_b.name}
                      onChange={(e) => handleChange(e, 'config_b')}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      目标URL *
                    </label>
                    <input
                      type="url"
                      name="target_url"
                      value={formData.config_b.target_url}
                      onChange={(e) => handleChange(e, 'config_b')}
                      required
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      name="api_key"
                      value={formData.config_b.api_key}
                      onChange={(e) => handleChange(e, 'config_b')}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="sk-..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-dark-500">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-dark-500 hover:bg-dark-400 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  开始A/B测试
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
