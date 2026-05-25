import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { PracticeHistory } from '../types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface HistoryChartProps {
  history: PracticeHistory[]
}

export function HistoryChart({ history }: HistoryChartProps) {
  const chartData = useMemo(() => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
      '#14b8a6', '#a855f7', '#eab308', '#22c55e', '#0ea5e9',
      '#f43f5e', '#64748b', '#78716c', '#0891b2', '#be185d'
    ]

    const datasets = history.map((item, idx) => {
      const sortedRecords = [...item.records].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      return {
        label: item.word,
        data: sortedRecords.map(r => r.score),
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length] + '20',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    })

    const allLabels = new Set<string>()
    history.forEach(item => {
      item.records.forEach(r => {
        const date = new Date(r.created_at)
        allLabels.add(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }))
      })
    })

    const sortedLabels = Array.from(allLabels).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime()
    })

    return {
      labels: sortedLabels,
      datasets
    }
  }, [history])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}分`
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: function(value: any) {
            return value + '分'
          }
        },
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <p className="text-lg">暂无练习记录</p>
        <p className="text-sm mt-1">完成首次练习后将显示趋势图</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <h3 className="text-sm font-medium text-slate-600 mb-4">练习趋势</h3>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
