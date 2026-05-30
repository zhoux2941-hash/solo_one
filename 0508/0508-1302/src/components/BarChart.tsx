import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BayesianParams, BayesianResult } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  params: BayesianParams;
  result: BayesianResult;
}

export const BarChart: React.FC<BarChartProps> = ({ params, result }) => {
  const options: ChartOptions<'bar'> = {
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
            return `${context.dataset.label}: ${(value * 100).toFixed(2)}%`;
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
    }
  };

  const data = {
    labels: ['先验概率', '后验概率'],
    datasets: [
      {
        label: '患病概率',
        data: [params.priorProbability, result.posteriorProbability],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
        <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
        先验 vs 后验概率对比
      </h2>
      <div className="h-64">
        <Bar options={options} data={data} />
      </div>
      <div className="mt-4 text-sm text-slate-600 text-center">
        <p>
          概率变化: 
          <span className="font-bold text-blue-600 ml-2">
            {(params.priorProbability * 100).toFixed(2)}%
          </span>
          <span className="mx-2">→</span>
          <span className="font-bold text-emerald-600">
            {(result.posteriorProbability * 100).toFixed(2)}%
          </span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          提升了 {((result.posteriorProbability - params.priorProbability) * 100).toFixed(2)} 个百分点
        </p>
      </div>
    </div>
  );
};
