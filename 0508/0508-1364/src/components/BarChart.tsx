import { useEffect, useRef, memo, useState } from 'react';
import * as echarts from 'echarts';
import type { AuthorStats } from '../types';
import { AUTHOR_COLORS } from '../types';
import type { EChartsOption } from 'echarts';
import { formatNumber } from '../utils/dateUtils';
import { ArrowUpDown } from 'lucide-react';

interface BarChartProps {
  data: AuthorStats[];
  height?: number;
}

type SortType = 'commits' | 'insertions' | 'deletions';

export const BarChart = memo(function BarChart({ data, height = 400 }: BarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('commits');

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current || data.length === 0) return;

    const sortedData = [...data].sort((a, b) => {
      if (sortBy === 'commits') return b.totalCommits - a.totalCommits;
      if (sortBy === 'insertions') return b.totalInsertions - a.totalInsertions;
      return b.totalDeletions - a.totalDeletions;
    });

    const yAxisData = sortedData.map(d => d.name);
    const commitsData = sortedData.map(d => d.totalCommits);
    const insertionsData = sortedData.map(d => d.totalInsertions);
    const deletionsData = sortedData.map(d => d.totalDeletions);

    const option: EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 58, 95, 0.95)',
        borderColor: 'rgba(12, 138, 230, 0.3)',
        textStyle: {
          color: '#eceef2',
        },
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(12, 138, 230, 0.1)',
          },
        },
        formatter: (params: any) => {
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].name}</div>`;
          params.forEach((item: any) => {
            const color = item.color;
            const name = item.seriesName;
            result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${color};"></span>
              <span>${name}:</span>
              <span style="font-weight: 600; font-family: 'Space Mono', monospace;">${item.value.toLocaleString()}</span>
            </div>`;
          });
          return result;
        },
      },
      legend: {
        data: ['提交次数', '新增行数', '删除行数'],
        top: 10,
        textStyle: {
          color: '#b0b8c9',
        },
        itemGap: 24,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 60,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: 'rgba(12, 138, 230, 0.3)',
          },
        },
        axisLabel: {
          color: '#8591aa',
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(12, 138, 230, 0.1)',
          },
        },
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        axisLine: {
          lineStyle: {
            color: 'rgba(12, 138, 230, 0.3)',
          },
        },
        axisLabel: {
          color: '#8591aa',
        },
      },
      series: [
        {
          name: '提交次数',
          type: 'bar',
          data: commitsData,
          itemStyle: {
            color: '#0c8ae6',
            borderRadius: [0, 4, 4, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(12, 138, 230, 0.5)',
            },
          },
          barWidth: 12,
          animationDuration: 1500,
          animationEasing: 'elasticOut',
          animationDelay: (idx: number) => idx * 80,
        },
        {
          name: '新增行数',
          type: 'bar',
          data: insertionsData,
          itemStyle: {
            color: '#10b981',
            borderRadius: [0, 4, 4, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(16, 185, 129, 0.5)',
            },
          },
          barWidth: 12,
          animationDuration: 1500,
          animationEasing: 'elasticOut',
          animationDelay: (idx: number) => idx * 80 + 50,
        },
        {
          name: '删除行数',
          type: 'bar',
          data: deletionsData,
          itemStyle: {
            color: '#ff6b35',
            borderRadius: [0, 4, 4, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(255, 107, 53, 0.5)',
            },
          },
          barWidth: 12,
          animationDuration: 1500,
          animationEasing: 'elasticOut',
          animationDelay: (idx: number) => idx * 80 + 100,
        },
      ],
    };

    chartInstance.current.setOption(option, true);
  }, [data, sortBy]);

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'commits', label: '按提交数' },
    { value: 'insertions', label: '按新增行' },
    { value: 'deletions', label: '按删除行' },
  ];

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-400">排序:</span>
          <div className="flex bg-dark-900/50 rounded-lg border border-primary-500/20 overflow-hidden">
            {sortOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-all ${
                  sortBy === opt.value
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                }`}
              >
                <ArrowUpDown size={12} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div ref={chartRef} style={{ width: '100%', height }} />
    </div>
  );
});
