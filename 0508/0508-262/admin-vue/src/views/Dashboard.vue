<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon today-orders">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">今日订单</p>
              <p class="stat-value">{{ dashboardStats.todayOrders || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon month-orders">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">本月订单</p>
              <p class="stat-value">{{ dashboardStats.monthOrders || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon today-amount">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">今日营收</p>
              <p class="stat-value">¥{{ dashboardStats.todayAmount || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon month-amount">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">本月营收</p>
              <p class="stat-value">¥{{ dashboardStats.monthAmount || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单趋势（近7天）</span>
            </div>
          </template>
          <div ref="chartRef" style="width: 100%; height: 400px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const chartRef = ref(null)
const dashboardStats = ref({})
let chart = null

const loadDashboardStats = async () => {
  try {
    const res = await request.get('/statistics/dashboard')
    dashboardStats.value = res.data
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const loadOrderTrend = async () => {
  try {
    const res = await request.get('/statistics/order-trend', { params: { days: 7 } })
    renderChart(res.data)
  } catch (error) {
    console.error('加载趋势数据失败:', error)
  }
}

const renderChart = (data) => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['订单数', '营收']
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
      data: data.map(item => item.date)
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left'
      },
      {
        type: 'value',
        name: '营收(元)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        data: data.map(item => item.count),
        itemStyle: {
          color: '#409eff'
        }
      },
      {
        name: '营收',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: data.map(item => item.amount),
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }

  chart.setOption(option)
}

onMounted(() => {
  loadDashboardStats()
  nextTick(() => {
    loadOrderTrend()
  })

  window.addEventListener('resize', () => {
    chart?.resize()
  })
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.today-orders {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.month-orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.today-amount {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.month-amount {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-label {
  color: #999;
  font-size: 14px;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>