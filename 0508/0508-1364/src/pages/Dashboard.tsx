import { memo, useMemo } from 'react';
import { GitCommit, Users, FileCode, Plus, Minus, Clock, Activity, Cloud } from 'lucide-react';
import { useStore } from '../store/useStore';
import { FileUpload } from '../components/FileUpload';
import { StatsCard } from '../components/StatsCard';
import { FilterPanel } from '../components/FilterPanel';
import { LineChart } from '../components/LineChart';
import { BarChart } from '../components/BarChart';
import { Heatmap } from '../components/Heatmap';
import { WordCloud } from '../components/WordCloud';
import { DataTable } from '../components/DataTable';
import { formatNumber, getDaysDiff, formatTimeSpan, formatDate } from '../utils/dateUtils';
import { getTotalStats, calculateTrend } from '../utils/statistics';

export const Dashboard = memo(function Dashboard() {
  const {
    commits,
    filteredCommits,
    weeklyStats,
    authorStats,
    heatmapData,
    wordCloudData,
    dateRange,
  } = useStore();

  const totalStats = useMemo(() => getTotalStats(filteredCommits), [filteredCommits]);

  const trendData = useMemo(() => {
    if (weeklyStats.length < 2) return null;

    const currentWeek = weeklyStats[weeklyStats.length - 1];
    const previousWeek = weeklyStats[weeklyStats.length - 2];

    return {
      commits: calculateTrend(currentWeek.commits, previousWeek.commits),
      insertions: calculateTrend(currentWeek.insertions, previousWeek.insertions),
      deletions: calculateTrend(currentWeek.deletions, previousWeek.deletions),
    };
  }, [weeklyStats]);

  const timeSpan = useMemo(() => {
    if (!dateRange.min || !dateRange.max) return null;
    const days = getDaysDiff(dateRange.min, dateRange.max);
    return formatTimeSpan(days);
  }, [dateRange]);

  const hasData = commits.length > 0;

  return (
    <div className="min-h-screen bg-dark-950 bg-grid">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <header className="mb-8 opacity-0 animate-fade-in-up animate-fill-forwards">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30">
              <GitCommit size={32} className="text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Git <span className="gradient-text">提交日志分析</span>
              </h1>
              <p className="text-dark-400 mt-1">
                可视化分析团队代码提交历史，洞察开发节奏与贡献分布
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <FileUpload />

          {hasData && (
            <>
              <FilterPanel />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatsCard
                  title="总提交次数"
                  value={formatNumber(totalStats.totalCommits)}
                  icon={<Activity size={24} />}
                  trend={trendData?.commits ? {
                    ...trendData.commits,
                    label: '较上周',
                  } : undefined}
                  color="primary"
                  delay={200}
                />
                <StatsCard
                  title="贡献者人数"
                  value={totalStats.totalAuthors}
                  icon={<Users size={24} />}
                  color="success"
                  delay={300}
                />
                <StatsCard
                  title="新增代码行数"
                  value={formatNumber(totalStats.totalInsertions)}
                  icon={<Plus size={24} />}
                  trend={trendData?.insertions ? {
                    ...trendData.insertions,
                    label: '较上周',
                  } : undefined}
                  color="accent"
                  delay={400}
                />
                <StatsCard
                  title="删除代码行数"
                  value={formatNumber(totalStats.totalDeletions)}
                  icon={<Minus size={24} />}
                  trend={trendData?.deletions ? {
                    ...trendData.deletions,
                    label: '较上周',
                  } : undefined}
                  color="warning"
                  delay={500}
                />
                <StatsCard
                  title="时间跨度"
                  value={timeSpan || '-'}
                  icon={<Clock size={24} />}
                  delay={600}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in-up animate-fill-forwards animate-delay-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">提交趋势</h3>
                      <p className="text-xs text-dark-400">按周统计提交次数与代码行数变化</p>
                    </div>
                  </div>
                  <LineChart data={weeklyStats} height={380} />
                </div>

                <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in-up animate-fill-forwards animate-delay-400">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent-500/10 text-accent-400">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">作者贡献对比</h3>
                      <p className="text-xs text-dark-400">各作者的提交次数与代码增删统计</p>
                    </div>
                  </div>
                  <BarChart data={authorStats} height={380} />
                </div>
              </div>

              <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in-up animate-fill-forwards animate-delay-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">活跃度热力图</h3>
                    <p className="text-xs text-dark-400">按星期和小时展示提交时间分布密集度</p>
                  </div>
                </div>
                <Heatmap data={heatmapData} height={320} />
              </div>

              <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in-up animate-fill-forwards animate-delay-600">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Cloud size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">提交消息词云</h3>
                    <p className="text-xs text-dark-400">从 commit message 中提取的高频关键词</p>
                  </div>
                </div>
                <WordCloud data={wordCloudData} height={350} />
              </div>

              <DataTable />

              <footer className="text-center py-8 text-dark-500 text-sm opacity-0 animate-fade-in animate-fill-forwards animate-delay-700">
                <p>Git 提交日志分析系统 · 数据在本地处理，不会上传到服务器</p>
                <p className="mt-1 text-xs">
                  支持的格式：<code className="text-primary-400">git log --pretty=format:"%H|%an|%ae|%ad|%s" --numstat --date=iso</code>
                </p>
              </footer>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
