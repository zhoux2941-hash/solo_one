import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const StatsChart: React.FC = () => {
  const { typeStats, filteredRecords } = useAppStore();

  if (filteredRecords.length === 0) {
    return null;
  }

  const data = {
    labels: typeStats.map((stat) => stat.typeName),
    datasets: [
      {
        label: '投放正确率 (%)',
        data: typeStats.map((stat) => stat.accuracy.toFixed(1)),
        backgroundColor: typeStats.map((stat) => stat.color + 'CC'),
        borderColor: typeStats.map((stat) => stat.color),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
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
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const stat = typeStats[index];
            return [
              `正确率: ${stat.accuracy.toFixed(1)}%`,
              `正确投放: ${stat.correct} / ${stat.total}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value: any) => value + '%',
          color: '#6B7280',
          font: { size: 12 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#374151',
          font: { size: 13, weight: 500 as const },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="font-semibold text-gray-800">各垃圾类型投放正确率</h3>
      </div>
      
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {typeStats.map((stat) => (
          <div
            key={stat.type}
            className="p-3 rounded-lg bg-gray-50 text-center"
          >
            <div className="text-xs text-gray-500 mb-1">{stat.typeName}</div>
            <div
              className="text-lg font-bold"
              style={{ color: stat.color }}
            >
              {stat.accuracy.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">
              {stat.correct}/{stat.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
