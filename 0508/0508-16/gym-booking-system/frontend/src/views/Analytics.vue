<template>
  <div class="analytics">
    <el-card class="page-header-card">
      <div class="page-header">
        <h2>数据分析看板</h2>
        <p>查看健身房运营数据和课程表现分析</p>
      </div>
    </el-card>
    
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>教练签到率趋势</span>
              <el-select v-model="selectedCoach" placeholder="选择教练" style="width: 150px" @change="loadCoachChart">
                <el-option 
                  v-for="coach in coaches" 
                  :key="coach.coachId" 
                  :label="coach.coachName" 
                  :value="coach.coachId" 
                />
              </el-select>
            </div>
          </template>
          <div ref="lineChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>爽约率最高课程 TOP 5</span>
            </div>
          </template>
          <div ref="barChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>签到人数热力图</span>
              <span class="subtitle">X轴：星期几 | Y轴：时段</span>
            </div>
          </template>
          <div ref="heatmapChartRef" class="chart-container heatmap-chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { analyticsApi } from '../utils/api'

const lineChartRef = ref(null)
const barChartRef = ref(null)
const heatmapChartRef = ref(null)

let lineChart = null
let barChart = null
let heatmapChart = null

const coaches = ref([])
const selectedCoach = ref(null)

const initCharts = async () => {
  await nextTick()
  
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
  }
  
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value)
  }
  
  if (heatmapChartRef.value) {
    heatmapChart = echarts.init(heatmapChartRef.value)
  }
  
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  lineChart?.resize()
  barChart?.resize()
  heatmapChart?.resize()
}

const loadCoaches = async () => {
  try {
    const data = await analyticsApi.getCoaches()
    coaches.value = data
    if (data.length > 0) {
      selectedCoach.value = data[0].coachId
      await loadCoachChart()
    }
  } catch (error) {
    console.error('加载教练列表失败', error)
  }
}

const loadCoachChart = async () => {
  if (!selectedCoach.value || !lineChart) return
  
  try {
    const data = await analyticsApi.getCoachCheckinRate(selectedCoach.value, 30)
    
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>签到率: {c}%'
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
        data: data.dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [{
        name: '签到率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.rates,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        itemStyle: {
          color: '#409eff'
        }
      }]
    }
    
    lineChart.setOption(option)
  } catch (error) {
    console.error('加载教练签到率失败', error)
  }
}

const loadBarChart = async () => {
  if (!barChart) return
  
  try {
    const data = await analyticsApi.getTopNoShowCourses(5)
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const item = data[params[0].dataIndex]
          return `${item.courseName}<br/>爽约率: ${item.noShowRate}%<br/>总预约: ${item.totalBookings}人<br/>爽约人数: ${item.noShows}人`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.courseName),
        axisLabel: {
          interval: 0,
          rotate: 30
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [{
        name: '爽约率',
        type: 'bar',
        data: data.map(item => item.noShowRate),
        barWidth: '50%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f56c6c' },
            { offset: 1, color: '#f6a2a2' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%'
        }
      }]
    }
    
    barChart.setOption(option)
  } catch (error) {
    console.error('加载爽约率图表失败', error)
  }
}

const loadHeatmapChart = async () => {
  if (!heatmapChart) return
  
  try {
    const data = await analyticsApi.getCheckinHeatmap(4)
    
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const timeSlots = ['06:00-08:00', '08:00-10:00', '10:00-12:00', 
                      '12:00-14:00', '14:00-16:00', '16:00-18:00', 
                      '18:00-20:00', '20:00-22:00']
    
    const heatmapData = data.map(item => [
      days.indexOf(item.day),
      timeSlots.indexOf(item.timeSlot),
      item.value
    ])
    
    const maxValue = Math.max(...data.map(item => item.value), 1)
    
    const option = {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          return `${days[params.data[0]]}<br/>${timeSlots[params.data[1]]}<br/>签到人数: ${params.data[2]}人`
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '5%',
        bottom: '15%'
      },
      xAxis: {
        type: 'category',
        data: days,
        splitArea: {
          show: true
        },
        axisLabel: {
          fontWeight: 'bold'
        }
      },
      yAxis: {
        type: 'category',
        data: timeSlots,
        splitArea: {
          show: true
        },
        axisLabel: {
          fontWeight: 'bold'
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
        }
      },
      series: [{
        name: '签到人数',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          color: '#333',
          formatter: (params) => params.data[2] > 0 ? params.data[2] : ''
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
    
    heatmapChart.setOption(option)
  } catch (error) {
    console.error('加载热力图失败', error)
  }
}

onMounted(async () => {
  await initCharts()
  await loadCoaches()
  await loadBarChart()
  await loadHeatmapChart()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  barChart?.dispose()
  heatmapChart?.dispose()
})
</script>

<style scoped>
.analytics {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 12px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.chart-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.card-header .subtitle {
  color: #909399;
  font-weight: normal;
  font-size: 13px;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.heatmap-chart {
  height: 500px;
}
</style>
