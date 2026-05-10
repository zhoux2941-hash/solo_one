<template>
  <div class="stats-container">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button @click="$router.push('/home')">
            <el-icon><ArrowLeft /></el-icon> 返回首页
          </el-button>
          <span class="title" style="margin-left: 10px">数据统计</span>
        </div>
      </el-header>

      <el-main class="main-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <el-icon><Food /></el-icon>
                  <span>各作物上报数量统计</span>
                </div>
              </template>
              <div ref="cropChartRef" style="height: 400px"></div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <el-icon><Bug /></el-icon>
                  <span>常见病虫害排行</span>
                </div>
              </template>
              <div ref="pestChartRef" style="height: 400px"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getCropTypeStats, getPestNameStats } from '@/api/stats'

const cropChartRef = ref(null)
const pestChartRef = ref(null)
let cropChart = null
let pestChart = null

const loadCropStats = async () => {
  const res = await getCropTypeStats()
  const data = res.data || []
  const names = data.map((item) => item.name)
  const values = data.map((item) => item.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { rotate: 0 }
    },
    yAxis: {
      type: 'value',
      name: '上报数量'
    },
    series: [
      {
        name: '上报数量',
        type: 'bar',
        data: values,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        barWidth: '50%'
      }
    ]
  }

  cropChart.setOption(option)
}

const loadPestStats = async () => {
  const res = await getPestNameStats()
  const data = res.data || []
  const names = data.map((item) => item.name)
  const values = data.map((item) => item.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '发生次数'
    },
    yAxis: {
      type: 'category',
      data: names,
      inverse: true
    },
    series: [
      {
        name: '发生次数',
        type: 'bar',
        data: values,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#e6a23c' }
          ])
        },
        barWidth: '50%'
      }
    ]
  }

  pestChart.setOption(option)
}

const handleResize = () => {
  cropChart?.resize()
  pestChart?.resize()
}

onMounted(() => {
  cropChart = echarts.init(cropChartRef.value)
  pestChart = echarts.init(pestChartRef.value)
  loadCropStats()
  loadPestStats()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cropChart?.dispose()
  pestChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.stats-container {
  min-height: 100vh;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.main-content {
  padding: 20px 40px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}
</style>