<template>
  <div class="gauge-wrapper">
    <div class="gauge-title">{{ battery.batteryId }}</div>
    <div ref="gaugeRef" class="gauge-container"></div>
    <div class="battery-info">
      放电率: {{ battery.dischargeRate?.toFixed(4) || '-' }} %/min
      <br />
      差异系数: {{ battery.differentialCoefficient || '-' }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  battery: {
    type: Object,
    required: true
  }
})

const gaugeRef = ref(null)
let chart = null

const getOption = (value) => {
  const getColor = (v) => {
    if (v >= 60) return '#52c41a'
    if (v >= 30) return '#faad14'
    return '#f5222d'
  }

  return {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: {
          color: getColor(value)
        },
        progress: {
          show: true,
          width: 20
        },
        pointer: {
          show: true,
          length: '50%',
          width: 5,
          itemStyle: {
            color: '#333'
          }
        },
        axisLine: {
          lineStyle: {
            width: 20,
            color: [[1, '#e0e0e0']]
          }
        },
        axisTick: {
          distance: -30,
          splitNumber: 2,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        splitLine: {
          distance: -35,
          length: 10,
          lineStyle: {
            width: 3,
            color: '#999'
          }
        },
        axisLabel: {
          distance: 5,
          color: '#666',
          fontSize: 12
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 18,
          itemStyle: {
            borderWidth: 5,
            borderColor: getColor(value)
          }
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          fontSize: 24,
          fontWeight: 'bold',
          color: '#333',
          formatter: '{value}%',
          offsetCenter: [0, '20%']
        },
        data: [
          {
            value: value,
            name: '剩余电量'
          }
        ]
      }
    ]
  }
}

const initChart = () => {
  if (gaugeRef.value) {
    chart = echarts.init(gaugeRef.value)
    const value = props.battery.remainingBattery || 100
    chart.setOption(getOption(value))
  }
}

const updateChart = () => {
  if (chart) {
    const value = props.battery.remainingBattery || 100
    chart.setOption(getOption(value))
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

watch(() => props.battery.remainingBattery, () => {
  updateChart()
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

<style scoped>
.gauge-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.gauge-title {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}
</style>