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
import { dynastyMap } from '@/data/dynasties'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  dynastyA: string
  dynastyB: string
  riceA: number
  riceB: number
  officialName: string
}

export default function CompareChart({ dynastyA, dynastyB, riceA, riceB, officialName }: Props) {
  const dA = dynastyMap[dynastyA]
  const dB = dynastyMap[dynastyB]

  const data = {
    labels: ['禄米折算(石/年)'],
    datasets: [
      {
        label: `${dA?.name || dynastyA} · ${officialName}`,
        data: [riceA],
        backgroundColor: (dA?.color || '#8B6914') + 'B0',
        borderRadius: 6,
        barPercentage: 0.5,
      },
      {
        label: `${dB?.name || dynastyB} · ${officialName}`,
        data: [riceB],
        backgroundColor: (dB?.color || '#5B3A6B') + 'B0',
        borderRadius: 6,
        barPercentage: 0.5,
      },
    ],
  }

  const options = {
    indexAxis: 'y' as const,
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
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#b8860b99',
          font: { family: 'DM Serif Display', size: 10 },
        },
        grid: { color: 'rgba(139, 105, 20, 0.1)' },
      },
      y: {
        ticks: {
          color: '#b8860b',
          font: { family: 'Noto Serif SC', size: 11 },
        },
        grid: { display: false },
      },
    },
  }

  return (
    <div className="h-36">
      <Bar data={data} options={options} />
    </div>
  )
}
