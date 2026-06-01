import { useMemo, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { MetricSeries } from '@/types';
import dayjs from 'dayjs';

const SERVICE_COLORS = [
  '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24',
  '#f87171', '#60a5fa', '#c084fc', '#fb923c', '#2dd4bf',
];

const METRIC_LABELS: Record<string, string> = {
  error_rate: '错误率 (%)',
  request_count: '请求量',
  p99_latency: 'P99延迟 (ms)',
};

interface Props {
  metricSeries: MetricSeries[];
  loading?: boolean;
  onBrushSelect?: (start: string, end: string) => void;
}

export default function TimelineChart({ metricSeries, loading, onBrushSelect }: Props) {
  const chartRef = useRef<any>(null);

  const serviceNames = useMemo(
    () => [...new Set(metricSeries.map((s) => s.service_name))],
    [metricSeries]
  );

  const metricTypes = useMemo(
    () => [...new Set(metricSeries.map((s) => s.metric_type))],
    [metricSeries]
  );

  const allTimestamps = useMemo(() => {
    const ts = new Set<string>();
    metricSeries.forEach((s) => s.data_points.forEach((p) => ts.add(p.timestamp)));
    return [...ts].sort();
  }, [metricSeries]);

  const handleBrush = useCallback(
    (params: any) => {
      if (params.batch && params.batch[0]?.areas?.[0]) {
        const area = params.batch[0].areas[0];
        const startIdx = Math.round(area.coordRange[0]);
        const endIdx = Math.round(area.coordRange[1]);
        if (allTimestamps[startIdx] && allTimestamps[endIdx] && onBrushSelect) {
          onBrushSelect(allTimestamps[startIdx], allTimestamps[endIdx]);
        }
      }
    },
    [allTimestamps, onBrushSelect]
  );

  const option = useMemo(() => {
    if (metricSeries.length === 0) return {};

    const series = metricSeries.map((s, idx) => {
      const colorIdx = serviceNames.indexOf(s.service_name) % SERVICE_COLORS.length;
      const data = allTimestamps.map((ts) => {
        const point = s.data_points.find((p) => p.timestamp === ts);
        return point ? point.value : null;
      });

      return {
        name: `${s.service_name} - ${METRIC_LABELS[s.metric_type] || s.metric_type}`,
        type: 'line' as const,
        data,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: SERVICE_COLORS[colorIdx] },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: SERVICE_COLORS[colorIdx] + '40' },
              { offset: 1, color: SERVICE_COLORS[colorIdx] + '00' },
            ],
          },
        },
      };
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
      },
      legend: {
        data: series.map((s) => s.name),
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: 0,
        type: 'scroll' as const,
      },
      grid: { top: 40, right: 20, bottom: 40, left: 60 },
      xAxis: {
        type: 'category' as const,
        data: allTimestamps.map((ts) => dayjs(ts).format('HH:mm')),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      dataZoom: [
        { type: 'inside' as const, xAxisIndex: 0 },
        {
          type: 'slider' as const,
          xAxisIndex: 0,
          height: 20,
          bottom: 5,
          borderColor: '#334155',
          fillerColor: 'rgba(34,211,238,0.15)',
          handleStyle: { color: '#22d3ee' },
          textStyle: { color: '#94a3b8' },
          dataBackground: {
            lineStyle: { color: '#334155' },
            areaStyle: { color: '#1e293b' },
          },
        },
      ],
      brush: {
        toolbox: ['rect'],
        xAxisIndex: 0,
        brushStyle: {
          borderColor: '#22d3ee',
          color: 'rgba(34,211,238,0.1)',
        },
      },
      series,
    };
  }, [metricSeries, serviceNames, allTimestamps]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="skeleton h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ height: '100%', minHeight: 300 }}
      onEvents={{ brushSelected: handleBrush }}
    />
  );
}
