import React, { useState } from 'react';
import type { LoadTestConfig, LoadTestMode, CompletionType } from '../types';

interface CreateTestFormProps {
  onSubmit: (config: LoadTestConfig) => void;
  onCancel: () => void;
}

export const CreateTestForm: React.FC<CreateTestFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<LoadTestConfig>({
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
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-600 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-dark-500">
          <h2 className="text-xl font-semibold text-white">创建压测任务</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                任务名称 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例如: API压测-生产环境"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                目标URL *
              </label>
              <input
                type="url"
                name="target_url"
                value={formData.target_url}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                API Key
              </label>
              <input
                type="password"
                name="api_key"
                value={formData.api_key}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                模型名称
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="gpt-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                接口类型 *
              </label>
              <select
                name="completion_type"
                value={formData.completion_type}
                onChange={handleChange}
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
                value={formData.mode}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="fixed_qps">固定QPS模式</option>
                <option value="linear_growth">线性增长模式</option>
                <option value="burst">突发流量模式</option>
                <option value="replay">真实回放模式</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                压测时长 (秒) *
              </label>
              <input
                type="number"
                name="duration_seconds"
                value={formData.duration_seconds}
                onChange={handleChange}
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
                value={formData.worker_count}
                onChange={handleChange}
                min="1"
                max="100"
                required
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
                value={formData.request_timeout_seconds}
                onChange={handleChange}
                min="1"
                max="300"
                className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {formData.mode === 'fixed_qps' && (
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                目标QPS *
              </label>
              <input
                type="number"
                name="fixed_qps"
                value={formData.fixed_qps}
                onChange={handleChange}
                min="1"
                max="10000"
                required
                className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          {formData.mode === 'linear_growth' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  起始QPS *
                </label>
                <input
                  type="number"
                  name="linear_start_qps"
                  value={formData.linear_start_qps}
                  onChange={handleChange}
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
                  value={formData.linear_end_qps}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {formData.mode === 'burst' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  基础QPS *
                </label>
                <input
                  type="number"
                  name="fixed_qps"
                  value={formData.fixed_qps}
                  onChange={handleChange}
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
                  value={formData.burst_multiplier}
                  onChange={handleChange}
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
                  value={formData.burst_at_seconds}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {formData.mode === 'replay' && (
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                回放速度
              </label>
              <input
                type="number"
                name="replay_speed"
                value={formData.replay_speed}
                onChange={handleChange}
                min="0.5"
                max="5"
                step="0.1"
                className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-dark-300 mt-1">
                1.0 表示按原始速度回放，0.5 表示慢放一倍，2.0 表示快放一倍
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-dark-500">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-dark-500 hover:bg-dark-400 text-white rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              开始压测
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
