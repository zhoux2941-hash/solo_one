import React from 'react';
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
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TestResult } from '../types';
import { formatProbability } from '../utils/formatters';

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

interface IterationChartProps {
  testResults: TestResult[];
  initialPrior: number;
}

export const IterationChart: React.FC<IterationChartProps> = ({ testResults, initialPrior }) => {
  if (testResults.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
          概率更新趋势
        </h2>
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
          <p className="text-slate-400 text-sm">添加检测记录后将显示概率变化趋势</p>
        </div>
      </div>
    );
  }

  const labels = ['初始', ...testResults.map(t => `检测${t.testNumber}`)];
  const probabilities = [initialPrior, ...testResults.map(t => t.result.posteriorProbability)];
  const pointColors = [
    'rgb(59, 130, 246)',
    ...testResults.map(t => t.testResult === 'positive' ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'),
  ];

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            const index = context.dataIndex;
            let label = `患病概率: ${formatProbability(value)}`;
            if (index > 0) {
              const test = testResults[index - 1];
              label += ` (${test.testResult === 'positive' ? '阳性' : '阴性'})`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          callback: function(value) {
            return (Number(value) * 100).toFixed(0) + '%';
          }
        }
      }
    },
  };

  const data = {
    labels,
    datasets: [
      {
        label: '患病概率',
        data: probabilities,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: pointColors,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const maxProb = Math.max(...probabilities);
  const minProb = Math.min(...probabilities);
  const change = probabilities[probabilities.length - 1] - initialPrior;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
        <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
        概率更新趋势
      </h2>
      <div className="h-64">
        <Line options={options} data={data} />
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-500"></span>
          <span className="text-sm text-slate-600">初始概率</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-red-500"></span>
          <span className="text-sm text-slate-600">阳性检测</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-green-500"></span>
          <span className="text-sm text-slate-600">阴性检测</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">初始概率</p>
          <p className="text-lg font-bold text-blue-700">{formatProbability(initialPrior)}</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-600 font-medium">当前概率</p>
          <p className="text-lg font-bold text-purple-700">{formatProbability(probabilities[probabilities.length - 1])}</p>
        </div>
        <div className={`text-center p-3 rounded-lg ${change >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className={`text-xs font-medium ${change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            变化
          </p>
          <p className={`text-lg font-bold ${change >= 0 ? 'text-red-700' : 'text-green-700'}`}>
            {change >= 0 ? '+' : ''}{formatProbability(change)}
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-600 text-center">
          概率范围: {formatProbability(minProb)} ~ {formatProbability(maxProb)}
          {testResults.length > 0 && (
            <span className="ml-2">
              | 波动幅度: {formatProbability(maxProb - minProb)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
