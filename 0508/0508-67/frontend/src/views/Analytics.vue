<template>
  <div class="analytics">
    <div class="page-header">
      <h2>数据分析</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>各饮水机用水速度（升/小时）</span>
              <el-select v-model="selectedHours" size="small" @change="loadAllData" style="width: 120px;">
                <el-option :value="24" label="最近24小时" />
                <el-option :value="72" label="最近3天" />
                <el-option :value="168" label="最近7天" />
              </el-select>
            </div>
          </template>
          <div ref="rateChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>送水员响应时长分布</span>
          </template>
          <div ref="histogramChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>单台饮水机用水趋势分析</span>
              <el-select v-model="selectedMachineId" size="small" @change="loadMachineHistory" style="width: 200px;">
                <el-option 
                  v-for="machine in machines" 
                  :key="machine.machineId" 
                  :value="machine.machineId" 
                  :label="machine.floor + '楼 - ' + machine.location" 
                />
              </el-select>
            </div>
          </template>
          <div ref="historyChartRef" class="chart-container" style="height: 450px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { getConsumptionRates, getResponseTimeHistogram, getMachineConsumptionHistory, getMachinesStatus } from '../api'

const rateChartRef = ref(null)
const histogramChartRef = ref(null)
const historyChartRef = ref(null)

let rateChart = null
let histogramChart = null
let historyChart = null

const selectedHours = ref(24)
const selectedMachineId = ref(null)
const machines = ref([])

const initCharts = () => {
  rateChart = echarts.init(rateChartRef.value)
  histogramChart = echarts.init(histogramChartRef.value)
  historyChart = echarts.init(historyChartRef.value)
  
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  rateChart?.resize()
  histogramChart?.resize()
  historyChart?.resize()
}

const loadConsumptionRates = async () => {
  try {
    const response = await getConsumptionRates()
    const data = response.data
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}<br/>用水速度: {c} L/h'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.floor + '楼-' + item.location),
        axisLabel: {
          rotate: 30
        }
      },
      yAxis: {
        type: 'value',
        name: '升/小时'
      },
      series: [{
        type: 'bar',
        data: data.map(item => ({
          value: item.consumptionRate,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          }
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}'
        }
      }]
    }
    
    rateChart.setOption(option)
  } catch (error) {
    ElMessage.error('加载用水速度数据失败')
  }
}

const loadHistogram = async () => {
  try {
    const response = await getResponseTimeHistogram()
    const data = response.data
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}<br/>工单数量: {c}'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: Object.keys(data)
      },
      yAxis: {
        type: 'value',
        name: '工单数量'
      },
      series: [{
        type: 'bar',
        data: Object.values(data),
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#409eff' }
          ])
        },
        label: {
          show: true,
          position: 'top'
        }
      }]
    }
    
    histogramChart.setOption(option)
  } catch (error) {
    ElMessage.error('加载响应时长分布失败')
  }
}

const loadMachineHistory = async () => {
  if (!selectedMachineId.value) return
  
  try {
    const response = await getMachineConsumptionHistory(selectedMachineId.value, selectedHours.value)
    const data = response.data
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['剩余水量', '用水速度趋势'],
        top: 0
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
        data: data.map(item => {
          const date = new Date(item.time)
          return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        })
      },
      yAxis: [
        {
          type: 'value',
          name: '剩余水量(L)',
          position: 'left'
        },
        {
          type: 'value',
          name: '用水速度(L/h)',
          position: 'right'
        }
      ],
      series: [
        {
          name: '剩余水量',
          type: 'line',
          smooth: true,
          data: data.map(item => item.remainingLiters),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          },
          lineStyle: {
            color: '#409eff',
            width: 2
          }
        },
        {
          name: '低水位预警线',
          type: 'line',
          smooth: false,
          yAxisIndex: 0,
          data: data.map(() => 5),
          lineStyle: {
            color: '#f56c6c',
            width: 2,
            type: 'dashed'
          },
          symbol: 'none'
        }
      ]
    }
    
    historyChart.setOption(option)
  } catch (error) {
    ElMessage.error('加载历史数据失败')
  }
}

const loadMachines = async () => {
  try {
    const response = await getMachinesStatus()
    machines.value = response.data
    if (machines.value.length > 0 && !selectedMachineId.value) {
      selectedMachineId.value = machines.value[0].machineId
      await nextTick()
      loadMachineHistory()
    }
  } catch (error) {
    console.error('加载饮水机列表失败')
  }
}

const loadAllData = async () => {
  await Promise.all([
    loadConsumptionRates(),
    loadHistogram(),
    loadMachineHistory()
  ])
}

onMounted(async () => {
  await nextTick()
  initCharts()
  await loadMachines()
  await loadAllData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  rateChart?.dispose()
  histogramChart?.dispose()
  historyChart?.dispose()
})
</script>

<style scoped>
.analytics {
  padding: 0;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  width: 100%;
  height: 350px;
}
</style>
