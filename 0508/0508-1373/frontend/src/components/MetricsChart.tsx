import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { AggregatedMetrics, Timestamp } from '../types';
import { parseTimestamp } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetricsChartProps {
  metrics: AggregatedMetrics[];
  title?: string;
  type: 'qps' | 'latency' | 'error';
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  metrics,
  title,
  type,
}) => {
  const data = useMemo(() => {
    const labels = metrics.map((m) =>
      parseTimestamp(m.timestamp as Timestamp).toLocaleTimeString()
    );

    if (type === 'qps') {
      return {
        labels,
        datasets: [
          {
            label: '实际QPS',
            data: metrics.map((m) => m.actual_qps),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
          },
          ...(metrics[0]?.target_qps
            ? [
                {
                  label: '目标QPS',
                  data: metrics.map((m) => m.target_qps),
                  borderColor: 'rgb(245, 158, 11)',
                  borderDash: [5, 5],
                  fill: false,
                  tension: 0,
                },
              ]
            : []),
        ],
      };
    }

    if (type === 'latency') {
      return {
        labels,
        datasets: [
          {
            label: 'TTFT P95 (ms)',
            data: metrics.map((m) => m.ttft_percentiles?.P95 || 0),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
          },
          {
            label: 'TPOT P95 (ms)',
            data: metrics.map((m) => m.tpot_percentiles?.P95 || 0),
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
          },
          {
            label: '总延迟 P95 (ms)',
            data: metrics.map((m) => m.total_percentiles?.P95 || 0),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: '错误率 (%)',
          data: metrics.map((m) => m.error_rate),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [metrics, type]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
        },
      },
      title: title ? { display: true, text: title, color: '#e2e8f0' } : undefined,
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
    },
  };

  return (
    <div className="bg-dark-600 rounded-lg p-4">
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
