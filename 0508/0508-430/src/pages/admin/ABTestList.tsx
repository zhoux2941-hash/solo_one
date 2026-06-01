import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Plus, Play, Square, Eye, Clock, CheckCircle } from 'lucide-react';
import { abtestApi } from '../../utils/api.js';
import { ABTest } from '../../../shared/index.js';

export default function ABTestList() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testName, setTestName] = useState('');
  const [algorithmA, setAlgorithmA] = useState('default');
  const [algorithmB, setAlgorithmB] = useState('click_weighted');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await abtestApi.getAll();
      setTests(data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async () => {
    if (!testName.trim()) return;
    try {
      await abtestApi.create(testName.trim(), algorithmA, algorithmB);
      setShowCreateModal(false);
      setTestName('');
      setAlgorithmA('default');
      setAlgorithmB('click_weighted');
      loadData();
    } catch (error) {
      console.error('创建测试失败:', error);
    }
  };

  const handleStartTest = async (id: string) => {
    if (!confirm('确定要启动此A/B测试吗？启动后用户将被随机分配到不同算法组。')) return;
    try {
      await abtestApi.updateStatus(id, 'running');
      loadData();
    } catch (error) {
      console.error('启动测试失败:', error);
    }
  };

  const handleStopTest = async (id: string) => {
    if (!confirm('确定要停止此A/B测试吗？停止后将不再分配新用户。')) return;
    try {
      await abtestApi.updateStatus(id, 'completed');
      loadData();
    } catch (error) {
      console.error('停止测试失败:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
      draft: { label: '草稿', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock },
      running: { label: '进行中', color: 'text-green-700', bgColor: 'bg-green-100', icon: Play },
      completed: { label: '已结束', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle }
    };
    return configs[status] || configs.draft;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const algorithmNames: Record<string, string> = {
    'default': '算法A：默认相关度排序',
    'click_weighted': '算法B：点击率加权排序'
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48 mb-8"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">A/B测试管理</h1>
          <p className="text-gray-500">管理搜索排序算法的A/B测试</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-5 h-5" />
          新建测试
        </button>
      </div>

      <div className="space-y-4">
        {tests.length > 0 ? (
          tests.map(test => {
            const statusConfig = getStatusConfig(test.status);
            const StatusIcon = statusConfig.icon;
            return (
              <div key={test.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FlaskConical className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{test.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p>{algorithmNames[test.algorithmA]} vs {algorithmNames[test.algorithmB]}</p>
                        <p>开始时间：{formatDate(test.startTime)} · 结束时间：{formatDate(test.endTime)}</p>
                        <p>创建人：{test.createdBy} · {formatDate(test.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/admin/abtest/${test.id}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      查看报告
                    </button>
                    {test.status === 'draft' && (
                      <button
                        onClick={() => handleStartTest(test.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        <Play className="w-4 h-4" />
                        启动
                      </button>
                    )}
                    {test.status === 'running' && (
                      <button
                        onClick={() => handleStopTest(test.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        <Square className="w-4 h-4" />
                        停止
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无A/B测试</h3>
            <p className="text-gray-500 mb-6">创建一个A/B测试来对比不同搜索算法的效果</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              新建测试
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">新建A/B测试</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">测试名称</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="输入测试名称，如：搜索排序算法对比测试"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">算法A（对照组）</label>
                <select
                  value={algorithmA}
                  onChange={(e) => setAlgorithmA(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  <option value="default">默认相关度排序</option>
                  <option value="click_weighted">点击率加权排序</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">算法B（实验组）</label>
                <select
                  value={algorithmB}
                  onChange={(e) => setAlgorithmB(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  <option value="click_weighted">点击率加权排序</option>
                  <option value="default">默认相关度排序</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleCreateTest}
                disabled={!testName.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建测试
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
