<template>
  <div class="cost-chart">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const chartData = computed(() => ({
  labels: ['提前预热策略（智能排班）', '临时开启策略（高峰期全开）'],
  datasets: [
    {
      label: '预热能耗成本（元）',
      data: [props.data.advancedWarmup.warmupEnergyKwh * 0.8, props.data.instantOn.warmupEnergyKwh * 0.8],
      backgroundColor: 'rgba(255, 193, 7, 0.8)',
      borderColor: 'rgba(255, 193, 7, 1)',
      borderWidth: 2,
      borderRadius: 8,
      stack: 'stack1'
    },
    {
      label: '运行能耗成本（元）',
      data: [props.data.advancedWarmup.runningEnergyKwh * 0.8, props.data.instantOn.runningEnergyKwh * 0.8],
      backgroundColor: 'rgba(81, 207, 102, 0.8)',
      borderColor: 'rgba(81, 207, 102, 1)',
      borderWidth: 2,
      borderRadius: 8,
      stack: 'stack1'
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14
      },
      bodyFont: {
        size: 13
      },
      cornerRadius: 8,
      callbacks: {
        afterLabel: function(context) {
          const datasetIndex = context.datasetIndex
          const dataIndex = context.dataIndex
          const total = props.data.advancedWarmup.totalCost
          const instantTotal = props.data.instantOn.totalCost
          
          if (datasetIndex === 1) {
            if (dataIndex === 0) {
              return ['', `总成本: ${total.toFixed(2)} 元`]
            } else {
              return ['', `总成本: ${instantTotal.toFixed(2)} 元`]
            }
          }
          return ''
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 12
        }
      }
    },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: '成本（元）',
        font: {
          size: 12
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 11
        },
        callback: function(value) {
          return value + ' 元'
        }
      }
    }
  }
}))
</script>
