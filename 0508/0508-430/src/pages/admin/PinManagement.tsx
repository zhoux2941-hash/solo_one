import { useState, useEffect } from 'react';
import { Pin, Plus, X, Trash2 } from 'lucide-react';
import { pinApi, searchApi } from '../../utils/api.js';
import { PinConfig, Article } from '../../../shared/index.js';

export default function PinManagement() {
  const [pins, setPins] = useState<PinConfig[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pinsData, articlesData] = await Promise.all([
        pinApi.getAll(),
        searchApi.getArticles()
      ]);
      setPins(pinsData);
      setArticles(articlesData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = async () => {
    if (!keyword.trim() || !selectedArticleId) return;
    try {
      const article = articles.find(a => a.id === selectedArticleId);
      if (!article) return;
      await pinApi.setPin(keyword.trim(), selectedArticleId, article.title);
      setShowModal(false);
      setKeyword('');
      setSelectedArticleId('');
      loadData();
    } catch (error) {
      console.error('创建置顶失败:', error);
    }
  };

  const handleRemovePin = async (id: string) => {
    if (!confirm('确定要取消此置顶吗？')) return;
    try {
      await pinApi.removePin(id);
      loadData();
    } catch (error) {
      console.error('取消置顶失败:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48 mb-8"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">置顶管理</h1>
          <p className="text-gray-500">管理关键词的置顶文章配置</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-5 h-5" />
          新建置顶
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {pins.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {pins.map(pin => (
              <div key={pin.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      pin.isActive ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Pin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-800 text-lg">"{pin.keyword}"</span>
                        {pin.isActive ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            生效中
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                            已失效
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">
                        置顶文章：<span className="font-medium text-blue-600">{pin.articleTitle}</span>
                      </p>
                      <p className="text-sm text-gray-400">
                        创建人：{pin.createdBy} · {formatDate(pin.createdAt)}
                      </p>
                    </div>
                  </div>
                  {pin.isActive && (
                    <button
                      onClick={() => handleRemovePin(pin.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="取消置顶"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pin className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无置顶配置</h3>
            <p className="text-gray-500 mb-6">点击右上角按钮创建第一个置顶配置</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              新建置顶
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">新建置顶配置</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">关键词</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="输入搜索关键词，如：VPN配置"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择置顶文章</label>
                <select
                  value={selectedArticleId}
                  onChange={(e) => setSelectedArticleId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  <option value="">请选择要置顶的文章</option>
                  {articles.map(article => (
                    <option key={article.id} value={article.id}>{article.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleCreatePin}
                disabled={!keyword.trim() || !selectedArticleId}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建置顶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
