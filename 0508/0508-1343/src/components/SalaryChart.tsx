import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { getSalaryRecordsByOfficial } from '@/data/salaries'
import { dynasties, dynastyMap } from '@/data/dynasties'
import { salaryToRiceShi } from '@/utils/purchasingPower'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  officialId: string
  dynastyId: string
}

export default function SalaryChart({ officialId, dynastyId }: Props) {
  const records = getSalaryRecordsByOfficial(officialId)

  const data = {
    labels: records.map(r => {
      const d = dynastyMap[r.dynastyId]
      return d ? d.name : r.dynastyId
    }),
    datasets: [
      {
        label: '折米(石/年)',
        data: records.map(r => {
          const rice = salaryToRiceShi(r.dynastyId, r.officialId, r.salary)
          return Math.round(rice)
        }),
        backgroundColor: records.map(r =>
          r.dynastyId === dynastyId
            ? 'rgba(199, 62, 58, 0.8)'
            : 'rgba(139, 105, 20, 0.5)'
        ),
        borderRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#d4a056',
          font: { family: 'Noto Serif SC', size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 20, 10, 0.9)',
        titleFont: { family: 'Noto Serif SC' },
        bodyFont: { family: 'LXGW WenKai' },
        borderColor: 'rgba(139, 105, 20, 0.3)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#b8860b',
          font: { family: 'Noto Serif SC', size: 12 },
        },
        grid: { color: 'rgba(139, 105, 20, 0.1)' },
      },
      y: {
        ticks: {
          color: '#b8860b99',
          font: { family: 'DM Serif Display', size: 10 },
        },
        grid: { color: 'rgba(139, 105, 20, 0.1)' },
      },
    },
  }

  return (
    <div className="h-56 mt-2">
      <div className="text-xs text-amber-500/50 font-serif mb-2">
        各朝代俸禄对比（米石/年）
      </div>
      <Bar data={data} options={options} />
    </div>
  )
}
