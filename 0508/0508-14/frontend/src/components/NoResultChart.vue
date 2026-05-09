<template>
  <div>
    <div class="card-title">搜索无结果率趋势（近7天）</div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { analyticsApi } from '../utils/api'

const chartRef = ref(null)
let chart = null

const initChart = async () => {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)

  try {
    const response = await analyticsApi.getNoResultRate(7)
    const data = response.data

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>无结果率: {c}%'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.labels || [],
        axisLabel: {
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '无结果率(%)',
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [{
        name: '无结果率',
        type: 'bar',
        data: data.data || [],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f56c6c' },
            { offset: 1, color: '#ff9c9c' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 12,
          color: '#606266'
        }
      }]
    }

    chart.setOption(option)
  } catch (error) {
    console.error('获取无结果率数据失败', error)
  }
}

const handleResize = () => {
  chart && chart.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart && chart.dispose()
})
</script>

<style scoped>
</style>
