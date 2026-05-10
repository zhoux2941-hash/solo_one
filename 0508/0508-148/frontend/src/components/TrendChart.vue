<template>
  <div class="trend-chart">
    <div class="chart-header">
      <div class="chart-title">
        <el-icon><TrendCharts /></el-icon>
        <span>水电用量趋势</span>
      </div>
      <el-radio-group v-model="chartType" size="small">
        <el-radio-button value="amount">金额趋势</el-radio-button>
        <el-radio-button value="usage">用量对比</el-radio-button>
      </el-radio-group>
    </div>
    <div ref="chartRef" class="chart-container"></div>
    <div class="chart-tips" v-if="tips.length > 0">
      <el-alert
        v-for="(tip, index) in tips"
        :key="index"
        :title="tip.title"
        :type="tip.type"
        :icon="tip.icon"
        show-icon
        :closable="false"
      >
        <template #default>
          {{ tip.message }}
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { TrendCharts, Warning, InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const chartRef = ref(null)
const chartInstance = ref(null)
const chartType = ref('amount')

const tips = computed(() => {
  if (!props.data || props.data.length < 2) return []
  
  const result = []
  const last = props.data[props.data.length - 1]
  const prev = props.data[props.data.length - 2]
  
  if (last && prev) {
    const elecDiff = last.electricityAmount - prev.electricityAmount
    const elecRate = prev.electricityAmount > 0 ? (elecDiff / prev.electricityAmount) * 100 : 0
    
    const waterDiff = last.waterAmount - prev.waterAmount
    const waterRate = prev.waterAmount > 0 ? (waterDiff / prev.waterAmount) * 100 : 0
    
    if (elecRate > 30) {
      result.push({
        title: `电费异常增长 ${elecRate.toFixed(1)}%`,
        message: `本月电费 ¥${last.electricityAmount}，较上月 ¥${prev.electricityAmount} 增长了 ${elecRate.toFixed(1)}%，请注意检查是否有设备忘记关闭。`,
        type: 'warning',
        icon: Warning
      })
    }
    
    if (waterRate > 30) {
      result.push({
        title: `水费异常增长 ${waterRate.toFixed(1)}%`,
        message: `本月水费 ¥${last.waterAmount}，较上月 ¥${prev.waterAmount} 增长了 ${waterRate.toFixed(1)}%，请注意检查是否有漏水情况。`,
        type: 'warning',
        icon: Warning
      })
    }
    
    if (elecRate <= 30 && waterRate <= 30 && props.data.length >= 3) {
      result.push({
        title: '用量正常',
        message: '本月水电用量与上月相比变化在正常范围内，继续保持节约用电用水的好习惯！',
        type: 'success',
        icon: InfoFilled
      })
    }
  }
  
  return result
})

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance.value = echarts.init(chartRef.value)
  updateChart()
  
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  chartInstance.value?.resize()
}

const updateChart = () => {
  if (!chartInstance.value || !props.data || props.data.length === 0) return
  
  const dates = props.data.map(item => item.billDate)
  const electricity = props.data.map(item => Number(item.electricityAmount))
  const water = props.data.map(item => Number(item.waterAmount))
  const total = props.data.map(item => Number(item.totalAmount))
  const perPerson = props.data.map(item => Number(item.perPersonAmount))
  
  let option
  
  if (chartType.value === 'amount') {
    option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params) => {
          let result = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValue}</div>`
          params.forEach(p => {
            result += `<div style="display: flex; justify-content: space-between; gap: 20px;">
              <span style="display: flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p.color};"></span>
                ${p.seriesName}
              </span>
              <span style="font-weight: bold;">¥${p.value}</span>
            </div>`
          })
          return result
        }
      },
      legend: {
        data: ['电费', '水费', '总费用', '人均费用'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: '#909399'
        }
      },
      yAxis: {
        type: 'value',
        name: '金额(元)',
        axisLabel: {
          formatter: '¥{value}',
          color: '#909399'
        }
      },
      series: [
        {
          name: '电费',
          type: 'line',
          data: electricity,
          smooth: true,
          itemStyle: { color: '#409eff' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ])
          }
        },
        {
          name: '水费',
          type: 'line',
          data: water,
          smooth: true,
          itemStyle: { color: '#67c23a' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
            ])
          }
        },
        {
          name: '总费用',
          type: 'line',
          data: total,
          smooth: true,
          itemStyle: { color: '#f56c6c' },
          lineStyle: { width: 3, type: 'dashed' }
        },
        {
          name: '人均费用',
          type: 'line',
          data: perPerson,
          smooth: true,
          itemStyle: { color: '#e6a23c' },
          lineStyle: { width: 3, type: 'dotted' }
        }
      ]
    }
  } else {
    option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          let result = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValue}</div>`
          params.forEach(p => {
            result += `<div style="display: flex; justify-content: space-between; gap: 20px;">
              <span style="display: flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p.color};"></span>
                ${p.seriesName}
              </span>
              <span style="font-weight: bold;">¥${p.value}</span>
            </div>`
          })
          return result
        }
      },
      legend: {
        data: ['电费', '水费'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: '#909399'
        }
      },
      yAxis: {
        type: 'value',
        name: '金额(元)',
        axisLabel: {
          formatter: '¥{value}',
          color: '#909399'
        }
      },
      series: [
        {
          name: '电费',
          type: 'bar',
          data: electricity,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#79bbff' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '30%'
        },
        {
          name: '水费',
          type: 'bar',
          data: water,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#67c23a' },
              { offset: 1, color: '#95d475' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '30%'
        }
      ]
    }
  }
  
  chartInstance.value.setOption(option, true)
}

watch(() => props.data, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

watch(chartType, () => {
  updateChart()
})

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance.value?.dispose()
})
</script>

<style scoped>
.trend-chart {
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .chart-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: bold;
      font-size: 16px;
      color: #303133;

      .el-icon {
        font-size: 20px;
        color: #409eff;
      }
    }
  }

  .chart-container {
    width: 100%;
    height: 320px;
  }

  .chart-tips {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
