import { useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts';
import type { HeatmapData } from '../types';
import { WEEKDAYS, HOURS } from '../types';
import type { EChartsOption } from 'echarts';

interface HeatmapProps {
  data: HeatmapData[][];
  height?: number;
}

export const Heatmap = memo(function Heatmap({ data, height = 350 }: HeatmapProps) {
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

    const flatData: [number, number, number][] = [];
    let maxCount = 0;

    for (let weekday = 0; weekday < 7; weekday++) {
      for (let hour = 0; hour < 24; hour++) {
        const count = data[weekday]?.[hour]?.count || 0;
        flatData.push([hour, weekday, count]);
        if (count > maxCount) maxCount = count;
      }
    }

    const option: EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        position: 'top',
        backgroundColor: 'rgba(30, 58, 95, 0.95)',
        borderColor: 'rgba(12, 138, 230, 0.3)',
        textStyle: {
          color: '#eceef2',
        },
        formatter: (params: any) => {
          const [hour, weekday, count] = params.value;
          return `<div style="font-weight: 600; margin-bottom: 4px;">${WEEKDAYS[weekday]} ${HOURS[hour]}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>提交次数:</span>
              <span style="font-weight: 600; font-family: 'Space Mono', monospace; color: #ff6b35;">${count}</span>
            </div>`;
        },
      },
      grid: {
        left: '8%',
        right: '5%',
        top: 40,
        bottom: '8%',
      },
      xAxis: {
        type: 'category',
        data: HOURS,
        splitArea: {
          show: true,
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(12, 138, 230, 0.3)',
          },
        },
        axisLabel: {
          color: '#8591aa',
          fontSize: 10,
          interval: 2,
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'category',
        data: WEEKDAYS,
        splitArea: {
          show: true,
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(12, 138, 230, 0.3)',
          },
        },
        axisLabel: {
          color: '#8591aa',
          fontSize: 12,
        },
        axisTick: {
          show: false,
        },
      },
      visualMap: {
        min: 0,
        max: maxCount || 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        textStyle: {
          color: '#8591aa',
        },
        inRange: {
          color: [
            '#1e3a5f',
            '#0c8ae6',
            '#36a7f6',
            '#10b981',
            '#f59e0b',
            '#ff6b35',
          ],
        },
        show: maxCount > 0,
      },
      series: [
        {
          name: '提交次数',
          type: 'heatmap',
          data: flatData,
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(255, 107, 53, 0.5)',
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
