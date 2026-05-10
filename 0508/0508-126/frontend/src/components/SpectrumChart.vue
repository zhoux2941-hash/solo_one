<template>
  <div class="chart-wrapper" v-if="shiftedWavelengths && intensities">
    <Line :data="chartData" :options="chartOptions" />
  </div>
  <div v-else class="loading">
    加载中...
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
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

const props = defineProps({
  wavelengths: {
    type: Array,
    default: () => []
  },
  intensities: {
    type: Array,
    default: () => []
  },
  lines: {
    type: Array,
    default: () => []
  },
  color: {
    type: String,
    default: '#4ecdc4'
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: ''
  },
  redshift: {
    type: Number,
    default: 0
  }
})

const shiftedWavelengths = computed(() => {
  if (!props.wavelengths || props.wavelengths.length === 0) return null
  if (props.redshift === 0) return props.wavelengths
  
  return props.wavelengths.map(wl => wl * (1 + props.redshift))
})

const shiftedLines = computed(() => {
  if (!props.lines || props.lines.length === 0) return []
  if (props.redshift === 0) return props.lines
  
  return props.lines.map(line => ({
    ...line,
    shiftedWavelength: line.wavelength / 10.0 * (1 + props.redshift)
  }))
})

const chartData = computed(() => ({
  labels: shiftedWavelengths.value,
  datasets: [{
    label: props.title || '光谱强度',
    data: props.intensities,
    borderColor: props.color,
    backgroundColor: props.color + '20',
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    pointHoverRadius: 3
  }]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 300
  },
  plugins: {
    legend: {
      display: props.showLegend,
      labels: {
        color: '#a0a0a0',
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      titleColor: '#e0e0e0',
      bodyColor: '#a0a0a0',
      borderColor: props.color,
      borderWidth: 1,
      padding: 12,
      callbacks: {
        title: (items) => {
          if (items.length > 0) {
            const shifted = items[0].label
            if (props.redshift !== 0 && shiftedWavelengths.value) {
              const idx = items[0].dataIndex
              const original = props.wavelengths[idx]
              return `观测波长: ${Number(shifted).toFixed(1)} nm (静止: ${original.toFixed(1)} nm)`
            }
            return `波长: ${shifted} nm`
          }
        },
        label: (item) => {
          return `强度: ${item.raw.toFixed(3)}`
        },
        afterTitle: () => {
          if (props.redshift !== 0) {
            return `z = ${props.redshift.toFixed(3)}`
          }
          return ''
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: props.redshift !== 0 ? `观测波长 (nm) [z = ${props.redshift.toFixed(3)}]` : '波长 (nm)',
        color: '#888',
        font: {
          size: 12
        }
      },
      ticks: {
        color: '#666',
        maxTicksLimit: 10,
        callback: (value, index, values) => {
          const wavelength = shiftedWavelengths.value ? shiftedWavelengths.value[value] : null
          return wavelength ? wavelength.toFixed(0) : ''
        }
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: '归一化强度',
        color: '#888',
        font: {
          size: 12
        }
      },
      min: 0,
      max: 1.1,
      ticks: {
        color: '#666',
        stepSize: 0.2
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      }
    }
  }
}))
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  font-size: 0.9rem;
}
</style>
