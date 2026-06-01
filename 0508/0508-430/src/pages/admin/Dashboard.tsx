import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, MessageSquare, TrendingUp, FlaskConical, Pin, Calendar } from 'lucide-react';
import { adminApi, pinApi } from '../../utils/api.js';
import { OverviewStats, LowSatisfactionKeyword, SatisfactionTrendItem, ArticleRankingItem } from '../../../shared/index.js';

export default function Dashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [lowSatisfactionKeywords, setLowSatisfactionKeywords] = useState<LowSatisfactionKeyword[]>([]);
  const [trendData, setTrendData] = useState<SatisfactionTrendItem[]>([]);
  const [rankingData, setRankingData] = useState<ArticleRankingItem[]>([]);
  const [trendGranularity, setTrendGranularity] = useState<'day' | 'hour'>('day');
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [articles, setArticles] = useState<{ id: string; title: string }[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    loadArticles();
  }, [trendGranularity]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, keywordsData, trendDataResult, rankingDataResult] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getLowSatisfactionKeywords(5, 0.3),
        adminApi.getSatisfactionTrend(trendGranularity, 7),
        adminApi.getArticleRanking(10, 'desc')
      ]);
      setOverview(overviewData);
      setLowSatisfactionKeywords(keywordsData);
      setTrendData(trendDataResult);
      setRankingData(rankingDataResult);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    try {
      const arts = await (await fetch('/api/articles')).json();
      setArticles(arts.map((a: any) => ({ id: a.id, title: a.title })));
    } catch (error) {
      console.error('加载文章失败:', error);
    }
  };

  const handleSetPin = async () => {
    if (!selectedKeyword || !selectedArticleId) return;
    try {
      const article = articles.find(a => a.id === selectedArticleId);
      if (!article) return;
      await pinApi.setPin(selectedKeyword, selectedArticleId, article.title);
      setShowPinModal(false);
      setSelectedKeyword('');
      setSelectedArticleId('');
      loadData();
    } catch (error) {
      console.error('设置置顶失败:', error);
    }
  };

  const formatRate = (rate: number) => {
    return (rate * 100).toFixed(1) + '%';
  };

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0];
        const item = trendData[data.dataIndex];
        return `${item.time}<br/>有用率: ${formatRate(item.usefulRate)}<br/>搜索次数: ${item.searchCount}`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.map(d => d.time),
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      max: 1,
      axisLabel: {
        formatter: (value: number) => (value * 100).toFixed(0) + '%',
        color: '#6B7280',
        fontSize: 12
      },
      splitLine: { lineStyle: { color: '#F3F4F6' } }
    },
    series: [{
      name: '有用率',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#3B82F6', width: 3 },
      itemStyle: { color: '#3B82F6' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ]
        }
      },
      data: trendData.map(d => d.usefulRate)
    }]
  };

  const rankingChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>满意率: ${formatRate(data.value)}`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      max: 1,
      axisLabel: {
        formatter: (value: number) => (value * 100).toFixed(0) + '%',
        color: '#6B7280',
        fontSize: 12
      },
      splitLine: { lineStyle: { color: '#F3F4F6' } }
    },
    yAxis: {
      type: 'category',
      data: rankingData.map(d => d.articleTitle.length > 15 ? d.articleTitle.slice(0, 15) + '...' : d.articleTitle).reverse(),
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280', fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: rankingData.map(d => ({
        value: d.usefulRate,
        itemStyle: {
          color: d.usefulRate >= 0.7 ? '#10B981' : d.usefulRate >= 0.5 ? '#F59E0B' : '#EF4444',
          borderRadius: [0, 6, 6, 0]
        }
      })).reverse(),
      barWidth: 20
    }]
  };

  const statCards = overview ? [
    { label: '今日搜索量', value: overview.todaySearches, icon: Search, color: 'blue' },
    { label: '总反馈数', value: overview.totalFeedbacks, icon: MessageSquare, color: 'green' },
    { label: '平均有用率', value: formatRate(overview.avgUsefulRate), icon: TrendingUp, color: 'indigo' },
    { label: '进行中A/B测试', value: overview.runningABTests, icon: FlaskConical, color: 'purple' }
  ] : [];

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-emerald-600',
      indigo: 'from-indigo-500 to-indigo-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return colors[color] || colors.blue;
  };

  if (loading && !overview) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">数据概览</h1>
        <p className="text-gray-500">查看搜索效果统计和用户反馈数据</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${getColorClass(card.color)} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{card.value}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">有用率趋势</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTrendGranularity('day')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  trendGranularity === 'day'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                按天
              </button>
              <button
                onClick={() => setTrendGranularity('hour')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  trendGranularity === 'hour'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                按小时
              </button>
            </div>
          </div>
          <ReactECharts option={trendChartOption} style={{ height: '300px' }} />
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">文章满意率排行</h3>
            <span className="text-sm text-gray-500">Top 10</span>
          </div>
          <ReactECharts option={rankingChartOption} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">低满意度关键词</h3>
            <span className="text-sm text-gray-500">搜索次数≥5 且 有用率{'<'}30%</span>
          </div>
        </div>
        {lowSatisfactionKeywords.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">关键词</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">搜索次数</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">反馈次数</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">有用率</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lowSatisfactionKeywords.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
                      {item.query}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.searchCount}</td>
                  <td className="px-6 py-4 text-gray-600">{item.feedbackCount}</td>
                  <td className="px-6 py-4">
                    <span className="text-red-600 font-semibold">{formatRate(item.usefulRate)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedKeyword(item.query);
                        setShowPinModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Pin className="w-4 h-4" />
                      设置置顶
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-500">
            暂无低满意度关键词，继续保持！
          </div>
        )}
      </div>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">设置置顶文章</h3>
            <p className="text-gray-500 mb-4">
              为关键词 <span className="font-medium text-blue-600">"{selectedKeyword}"</span> 选择置顶文章
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">选择文章</label>
              <select
                value={selectedArticleId}
                onChange={(e) => setSelectedArticleId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option value="">请选择要置顶的文章</option>
                {articles.map(article => (
                  <option key={article.id} value={article.id}>{article.title}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSetPin}
                disabled={!selectedArticleId}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认置顶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
