<template>
  <div>
    <div class="card-title">过去24小时搜索量趋势</div>
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
    const response = await analyticsApi.getVolumeTrend(24)
    const data = response.data

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>搜索量: {c}'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.labels || [],
        axisLabel: {
          rotate: 45,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        name: '搜索次数'
      },
      series: [{
        name: '搜索量',
        type: 'line',
        smooth: true,
        data: data.data || [],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.5)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#667eea',
          width: 3
        },
        itemStyle: {
          color: '#667eea'
        }
      }]
    }

    chart.setOption(option)
  } catch (error) {
    console.error('获取搜索量趋势数据失败', error)
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
