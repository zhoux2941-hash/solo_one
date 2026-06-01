import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { ArrowLeft, FlaskConical, Trophy, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { abtestApi } from '../../utils/api.js';
import { ABTest, ABTestReport } from '../../../shared/index.js';

export default function ABTestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<ABTest | null>(null);
  const [report, setReport] = useState<ABTestReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [testData, reportData] = await Promise.all([
        abtestApi.getById(id),
        abtestApi.getReport(id)
      ]);
      setTest(testData);
      setReport(reportData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string }> = {
      draft: { label: '草稿', color: 'text-gray-600', bgColor: 'bg-gray-100' },
      running: { label: '进行中', color: 'text-green-700', bgColor: 'bg-green-100' },
      completed: { label: '已结束', color: 'text-blue-700', bgColor: 'bg-blue-100' }
    };
    return configs[status] || configs.draft;
  };

  const algorithmNames: Record<string, string> = {
    'default': '默认相关度排序',
    'click_weighted': '点击率加权排序'
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

  const formatRate = (rate: number) => (rate * 100).toFixed(1) + '%';

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">测试不存在或已被删除</p>
        <button onClick={() => navigate('/admin/abtest')} className="mt-4 text-blue-600 hover:underline">
          返回列表
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(test.status);

  const comparisonChartOption = report ? {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['算法A', '算法B'],
      top: 0,
      textStyle: { color: '#6B7280' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['有用率', '反馈率'],
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280', fontSize: 13 }
    },
    yAxis: {
      type: 'value',
      max: 1,
      axisLabel: {
        formatter: (value: number) => (value * 100).toFixed(0) + '%',
        color: '#6B7280'
      },
      splitLine: { lineStyle: { color: '#F3F4F6' } }
    },
    series: [
      {
        name: '算法A',
        type: 'bar',
        barWidth: 40,
        itemStyle: { color: '#3B82F6', borderRadius: [6, 6, 0, 0] },
        data: [report.groupAStats.usefulRate, report.groupAStats.clickThroughRate]
      },
      {
        name: '算法B',
        type: 'bar',
        barWidth: 40,
        itemStyle: { color: '#8B5CF6', borderRadius: [6, 6, 0, 0] },
        data: [report.groupBStats.usefulRate, report.groupBStats.clickThroughRate]
      }
    ]
  } : {};

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/abtest')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{test.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            {algorithmNames[test.algorithmA]} vs {algorithmNames[test.algorithmB]}
            &nbsp;·&nbsp;开始：{formatDate(test.startTime)} &nbsp;·&nbsp;结束：{formatDate(test.endTime)}
          </p>
        </div>
      </div>

      {report && (
        <>
          <div className={`rounded-2xl p-6 mb-8 border-2 ${
            report.winner === 'A' ? 'bg-blue-50 border-blue-200' :
            report.winner === 'B' ? 'bg-purple-50 border-purple-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                report.winner === 'A' ? 'bg-blue-500' :
                report.winner === 'B' ? 'bg-purple-500' :
                'bg-gray-400'
              } shadow-lg`}>
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {report.winner === 'A' && '算法A（默认相关度排序）胜出'}
                  {report.winner === 'B' && '算法B（点击率加权排序）胜出'}
                  {report.winner === 'tie' && '两组算法表现相当'}
                </h2>
                <p className="text-gray-600 mt-1">
                  置信度：<span className="font-semibold">{(report.confidence * 100).toFixed(1)}%</span>
                  {report.confidence >= 0.95 && <span className="ml-2 text-green-600 font-medium">（统计显著）</span>}
                  {report.confidence < 0.95 && report.confidence >= 0.8 && <span className="ml-2 text-amber-600 font-medium">（较显著）</span>}
                  {report.confidence < 0.8 && <span className="ml-2 text-gray-500 font-medium">（数据不足，建议继续测试）</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">算法A</h3>
                  <p className="text-sm text-gray-500">{algorithmNames[test.algorithmA]}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2"><Users className="w-4 h-4" />搜索次数</span>
                  <span className="font-semibold text-gray-800">{report.groupAStats.totalSearches}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2"><BarChart3 className="w-4 h-4" />反馈总数</span>
                  <span className="font-semibold text-gray-800">{report.groupAStats.totalFeedbacks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2"><TrendingUp className="w-4 h-4" />有用率</span>
                  <span className={`font-bold text-lg ${report.groupAStats.usefulRate >= report.groupBStats.usefulRate ? 'text-green-600' : 'text-gray-800'}`}>
                    {formatRate(report.groupAStats.usefulRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">反馈率</span>
                  <span className="font-semibold text-gray-800">{formatRate(report.groupAStats.clickThroughRate)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">算法B</h3>
                  <p className="text-sm text-gray-500">{algorithmNames[test.algorithmB]}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2"><Users className="w-4 h-4" />搜索次数</span>
                  <span className="font-semibold text-gray-800">{report.groupBStats.totalSearches}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2"><BarChart3 className="w-4 h-4" />反馈总数</span>
                  <span className="font-semibold text-gray-800">{report.groupBStats.totalFeedbacks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2"><TrendingUp className="w-4 h-4" />有用率</span>
                  <span className={`font-bold text-lg ${report.groupBStats.usefulRate >= report.groupAStats.usefulRate ? 'text-green-600' : 'text-gray-800'}`}>
                    {formatRate(report.groupBStats.usefulRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">反馈率</span>
                  <span className="font-semibold text-gray-800">{formatRate(report.groupBStats.clickThroughRate)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">算法对比图表</h3>
            <ReactECharts option={comparisonChartOption} style={{ height: '350px' }} />
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">测试说明</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>1. 算法A使用默认相关度排序，根据标题和内容的关键词匹配度计算分数。</p>
              <p>2. 算法B使用点击率加权排序，在相关度基础上叠加文章历史点击率的权重。</p>
              <p>3. 用户按部门随机分组，同一部门的用户始终使用同一算法。</p>
              <p>4. 有用率 = 标记为"有用"的反馈数 / 总反馈数；反馈率 = 有反馈的搜索次数 / 总搜索次数。</p>
              <p>5. 置信度基于Z检验计算，≥95%视为统计显著，建议测试期间收集足够数据后再做决策。</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
