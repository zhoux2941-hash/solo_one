<template>
  <div class="radar-chart-container">
    <div v-if="chartData.labels.length > 0">
      <Radar :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="empty-chart">
      <el-empty description="暂无数据" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

const props = defineProps({
  formulas: {
    type: Array,
    default: () => []
  }
})

const colors = {
  A: { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgb(255, 99, 132)' },
  B: { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgb(54, 162, 235)' },
  C: { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgb(75, 192, 192)' },
  D: { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgb(255, 159, 64)' }
}

const chartData = computed(() => {
  if (!props.formulas || props.formulas.length === 0) {
    return { labels: [], datasets: [] }
  }

  const maxFreshDays = Math.max(...props.formulas.map(f => f.freshDays), 20)
  
  const labels = ['保鲜天数', '成本 (反向)', '易用性']

  const datasets = props.formulas.map(formula => {
    const color = colors[formula.formulaCode] || { bg: 'rgba(128,128,128,0.2)', border: 'rgb(128,128,128)' }
    const freshDays = Math.min(100, (formula.freshDays / maxFreshDays) * 100)
    const cost = Math.max(0, 100 - (formula.cost / 5) * 100)
    const easeOfUse = (formula.easeOfUse / 5) * 100

    return {
      label: `配方${formula.formulaCode} - ${formula.formulaName}`,
      data: [freshDays, cost, easeOfUse],
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 2,
      pointBackgroundColor: color.border,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: color.border
    }
  })

  return {
    labels,
    datasets
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        font: {
          size: 12
        }
      }
    }
  },
  scales: {
    r: {
      min: 0,
      max: 100,
      beginAtZero: true,
      ticks: {
        stepSize: 20,
        font: {
          size: 10
        }
      },
      pointLabels: {
        font: {
          size: 14,
          weight: 'bold'
        }
      }
    }
  }
}
</script>

<style scoped>
.radar-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-chart {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
