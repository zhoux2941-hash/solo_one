import { useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts';
import type { WeeklyStats } from '../types';
import type { EChartsOption } from 'echarts';

interface LineChartProps {
  data: WeeklyStats[];
  height?: number;
}

export const LineChart = memo(function LineChart({ data, height = 400 }: LineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

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

    const xAxisData = data.map(d => d.weekLabel);
    const commitsData = data.map(d => d.commits);
    const insertionsData = data.map(d => d.insertions);
    const deletionsData = data.map(d => d.deletions);

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
          type: 'cross',
          lineStyle: {
            color: 'rgba(12, 138, 230, 0.5)',
          },
        },
        formatter: (params: any) => {
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
          params.forEach((item: any) => {
            const color = item.color;
            const name = item.seriesName;
            const value = item.value;
            result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
              <span>${name}:</span>
              <span style="font-weight: 600; font-family: 'Space Mono', monospace;">${value.toLocaleString()}</span>
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
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        axisLine: {
          lineStyle: {
            color: 'rgba(12, 138, 230, 0.3)',
          },
        },
        axisLabel: {
          color: '#8591aa',
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '提交次数',
          position: 'left',
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(12, 138, 230, 0.5)',
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
          nameTextStyle: {
            color: '#b0b8c9',
            padding: [0, 0, 0, 40],
          },
        },
        {
          type: 'value',
          name: '代码行数',
          position: 'right',
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(16, 185, 129, 0.5)',
            },
          },
          axisLabel: {
            color: '#8591aa',
          },
          splitLine: {
            show: false,
          },
          nameTextStyle: {
            color: '#b0b8c9',
            padding: [0, 40, 0, 0],
          },
        },
      ],
      series: [
        {
          name: '提交次数',
          type: 'line',
          yAxisIndex: 0,
          data: commitsData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#0c8ae6',
          },
          lineStyle: {
            width: 3,
            color: '#0c8ae6',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(12, 138, 230, 0.3)' },
              { offset: 1, color: 'rgba(12, 138, 230, 0.05)' },
            ]),
          },
          emphasis: {
            itemStyle: {
              borderWidth: 2,
              borderColor: '#fff',
            },
          },
          animationDuration: 1500,
          animationEasing: 'cubicOut',
        },
        {
          name: '新增行数',
          type: 'line',
          yAxisIndex: 1,
          data: insertionsData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#10b981',
          },
          lineStyle: {
            width: 3,
            color: '#10b981',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
            ]),
          },
          emphasis: {
            itemStyle: {
              borderWidth: 2,
              borderColor: '#fff',
            },
          },
          animationDuration: 1500,
          animationEasing: 'cubicOut',
        },
        {
          name: '删除行数',
          type: 'line',
          yAxisIndex: 1,
          data: deletionsData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#ff6b35',
          },
          lineStyle: {
            width: 3,
            color: '#ff6b35',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 107, 53, 0.3)' },
              { offset: 1, color: 'rgba(255, 107, 53, 0.05)' },
            ]),
          },
          emphasis: {
            itemStyle: {
              borderWidth: 2,
              borderColor: '#fff',
            },
          },
          animationDuration: 1500,
          animationEasing: 'cubicOut',
        },
      ],
    };

    chartInstance.current.setOption(option, true);
  }, [data]);

  return (
    <div ref={chartRef} style={{ width: '100%', height }} />
  );
});
