import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TimeDistribution } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface TimeChartProps {
  data: TimeDistribution[];
}

export default function TimeChart({ data }: TimeChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        fill: true,
        label: '弹幕数量',
        data: data.map((d) => d.count),
        borderColor: '#FB7299',
        backgroundColor: 'rgba(251, 114, 153, 0.15)',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#FB7299',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '弹幕时间分布',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#333',
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items: any) => `时间: ${items[0].label}`,
          label: (item: any) => `弹幕数: ${item.raw}条`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 15,
          font: {
            size: 11,
          },
          color: '#666',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#666',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}
