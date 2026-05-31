import React from 'react';
import { TrendingUp, CheckCircle, XCircle, FileBarChart } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTotalStats } from '../utils/statistics';

export const StatsOverview: React.FC = () => {
  const { filteredRecords } = useAppStore();
  const totalStats = getTotalStats(filteredRecords);

  if (filteredRecords.length === 0) {
    return null;
  }

  const stats = [
    {
      label: '投放总数',
      value: totalStats.total,
      icon: FileBarChart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: '正确投放',
      value: totalStats.correct,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: '错误投放',
      value: totalStats.total - totalStats.correct,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: '总正确率',
      value: `${totalStats.accuracy.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
