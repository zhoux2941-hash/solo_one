<template>
  <div class="app-container">
    <header class="header">
      <h1 class="title">共享轮椅刹车片磨损同比分析仪</h1>
      <p class="subtitle">实时监控 8 辆共享轮椅的刹车片磨损状态 | 支持预测趋势分析</p>
      <div class="timestamp" v-if="lastUpdateTime">
        数据更新时间: {{ lastUpdateTime }}
      </div>
    </header>

    <main class="main-content">
      <div class="stats-cards">
        <div 
          class="card" 
          v-for="item in wearData" 
          :key="item.wheelchairId"
          :class="{ 'card-selected': selectedWheelchair === item.wheelchairId }"
          @click="handleCardClick(item.wheelchairId)"
        >
          <div class="card-header">
            <span class="wheelchair-id">{{ item.wheelchairId }}</span>
            <span class="status-badge" :class="getStatusClass(item.currentWear)">
              {{ getStatusText(item.currentWear) }}
            </span>
          </div>
          <div class="card-body">
            <div class="wear-value">{{ item.currentWear }}</div>
            <div class="wear-label">磨损值 (0-100)</div>
          </div>
          <div class="card-footer">
            <div class="growth-rate" :class="getGrowthClass(getGrowthRate(item.wheelchairId))">
              <span v-if="getGrowthRate(item.wheelchairId) > 0">↑</span>
              <span v-else-if="getGrowthRate(item.wheelchairId) < 0">↓</span>
              <span v-else>→</span>
              {{ Math.abs(getGrowthRate(item.wheelchairId)).toFixed(2) }}% 同比
            </div>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <h2 class="chart-title">双柱状图对比分析
          <span class="chart-hint" v-if="!selectedWheelchair">（点击柱子或卡片选择轮椅查看预测）</span>
          <span class="chart-hint selected" v-else>（已选择: {{ selectedWheelchair }}，点击其他切换）</span>
        </h2>
        <div ref="chartRef" class="chart"></div>
      </div>

      <div class="prediction-section">
        <PredictionChart 
          :predictionData="predictionData" 
          :selectedWheelchair="selectedWheelchair"
        />
      </div>

      <div class="data-tables">
        <div class="table-container">
          <h3>当前磨损值详情</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>轮椅编号</th>
                <th>磨损值</th>
                <th>记录日期</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="item in wearData" 
                :key="item.wheelchairId"
                :class="{ 'row-selected': selectedWheelchair === item.wheelchairId }"
                @click="handleCardClick(item.wheelchairId)"
              >
                <td>{{ item.wheelchairId }}</td>
                <td>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: item.currentWear + '%' }"
                      :class="getStatusClass(item.currentWear)"
                    ></div>
                    <span class="progress-text">{{ item.currentWear }}</span>
                  </div>
                </td>
                <td>{{ item.recordDate }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(item.currentWear)">
                    {{ getStatusText(item.currentWear) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-container">
          <h3>上月同比增幅</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>轮椅编号</th>
                <th>上月磨损</th>
                <th>本月磨损</th>
                <th>增幅</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in yoyData" :key="item.wheelchairId">
                <td>{{ item.wheelchairId }}</td>
                <td>{{ item.lastMonthWear }}</td>
                <td>{{ item.currentMonthWear }}</td>
                <td>
                  <span class="growth-rate" :class="getGrowthClass(item.growthRate)">
                    {{ item.growthRate > 0 ? '+' : '' }}{{ item.growthRate.toFixed(2) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>© 2026 共享轮椅刹车片磨损分析系统 | 预测数据缓存 2 小时</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getCurrentWear, getYearOverYear, getWearPrediction } from './api'
import PredictionChart from './components/PredictionChart.vue'

const chartRef = ref(null)
const wearData = ref([])
const yoyData = ref([])
const lastUpdateTime = ref('')
const selectedWheelchair = ref('')
const predictionData = ref(null)
let chartInstance = null

const fetchData = async () => {
  try {
    const [wearResponse, yoyResponse] = await Promise.all([
      getCurrentWear(),
      getYearOverYear()
    ])
    wearData.value = wearResponse.data
    yoyData.value = yoyResponse.data
    lastUpdateTime.value = new Date().toLocaleString('zh-CN')
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

const fetchPrediction = async (wheelchairId) => {
  if (!wheelchairId) {
    predictionData.value = null
    return
  }
  
  try {
    const response = await getWearPrediction(wheelchairId)
    predictionData.value = response.data
  } catch (error) {
    console.error('获取预测数据失败:', error)
    predictionData.value = null
  }
}

const handleCardClick = (wheelchairId) => {
  if (selectedWheelchair.value === wheelchairId) {
    selectedWheelchair.value = ''
    predictionData.value = null
  } else {
    selectedWheelchair.value = wheelchairId
    fetchPrediction(wheelchairId)
  }
  updateChart()
}

const handleChartClick = (params) => {
  if (params && params.name) {
    handleCardClick(params.name)
  }
}

const getGrowthRate = (wheelchairId) => {
  const item = yoyData.value.find(d => d.wheelchairId === wheelchairId)
  return item ? item.growthRate : 0
}

const getStatusClass = (wear) => {
  if (wear >= 70) return 'danger'
  if (wear >= 50) return 'warning'
  return 'normal'
}

const getStatusText = (wear) => {
  if (wear >= 70) return '需更换'
  if (wear >= 50) return '注意'
  return '正常'
}

const getGrowthClass = (rate) => {
  if (rate > 20) return 'high-growth'
  if (rate > 0) return 'positive-growth'
  if (rate < 0) return 'negative-growth'
  return 'no-growth'
}

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  chartInstance.on('click', handleChartClick)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance || wearData.value.length === 0) return

  const labels = wearData.value.map(d => d.wheelchairId)
  const wearValues = wearData.value.map(d => d.currentWear)
  const growthRates = yoyData.value.map(d => d.growthRate)

  const selectedIndex = labels.indexOf(selectedWheelchair.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        let result = `<strong>${params[0].name}</strong><br/>`
        params.forEach(param => {
          if (param.seriesName === '同比增幅') {
            result += `${param.seriesName}: ${param.value > 0 ? '+' : ''}${param.value.toFixed(2)}%<br/>`
          } else {
            result += `${param.seriesName}: ${param.value}<br/>`
          }
        })
        result += `<span style="color:#999;font-size:11px">点击查看预测趋势</span>`
        return result
      }
    },
    legend: {
      data: ['当前磨损值', '同比增幅'],
      top: 10,
      textStyle: {
        color: '#333',
        fontSize: 14
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        formatter: function(value) {
          return value
        }
      },
      axisLine: {
        lineStyle: {
          color: '#ccc'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '磨损值 (0-100)',
        nameTextStyle: {
          fontSize: 14,
          color: '#333'
        },
        min: 0,
        max: 100,
        axisLabel: {
          fontSize: 12,
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#e0e0e0'
          }
        }
      },
      {
        type: 'value',
        name: '增幅 (%)',
        nameTextStyle: {
          fontSize: 14,
          color: '#333'
        },
        axisLabel: {
          fontSize: 12,
          color: '#666',
          formatter: '{value}%'
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '当前磨损值',
        type: 'bar',
        data: wearValues.map((val, idx) => ({
          value: val,
          itemStyle: idx === selectedIndex ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f5576c' },
              { offset: 1, color: '#f093fb' }
            ]),
            shadowBlur: 10,
            shadowColor: 'rgba(245, 87, 108, 0.5)'
          } : null
        })),
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]),
          borderRadius: [6, 6, 0, 0],
          cursor: 'pointer'
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#5a6fd3' },
              { offset: 1, color: '#6a4192' }
            ])
          }
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      {
        name: '同比增幅',
        type: 'bar',
        yAxisIndex: 1,
        data: growthRates.map((val, idx) => ({
          value: val,
          itemStyle: idx === selectedIndex ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f5576c' },
              { offset: 1, color: '#f093fb' }
            ]),
            shadowBlur: 10,
            shadowColor: 'rgba(245, 87, 108, 0.5)'
          } : null
        })),
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f093fb' },
            { offset: 1, color: '#f5576c' }
          ]),
          borderRadius: [6, 6, 0, 0],
          cursor: 'pointer'
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#e083eb' },
              { offset: 1, color: '#e5475c' }
            ])
          }
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#333',
          formatter: function(params) {
            return (params.value > 0 ? '+' : '') + params.value.toFixed(1) + '%'
          }
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

watch([wearData, yoyData], () => {
  nextTick(() => {
    updateChart()
  })
})

onMounted(async () => {
  await fetchData()
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.off('click', handleChartClick)
    chartInstance.dispose()
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  padding-bottom: 30px;
}

.header {
  text-align: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
}

.timestamp {
  font-size: 14px;
  color: #999;
}

.main-content {
  padding: 0 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-selected {
  border: 2px solid #f5576c;
  box-shadow: 0 8px 30px rgba(245, 87, 108, 0.2);
}

.card-selected:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(245, 87, 108, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.wheelchair-id {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.normal {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.warning {
  background: #fff3e0;
  color: #ef6c00;
}

.status-badge.danger {
  background: #ffebee;
  color: #c62828;
}

.card-body {
  text-align: center;
  margin-bottom: 15px;
}

.wear-value {
  font-size: 48px;
  font-weight: 700;
  color: #667eea;
  line-height: 1;
}

.wear-label {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.card-footer {
  text-align: center;
}

.growth-rate {
  font-size: 14px;
  font-weight: 600;
}

.growth-rate.high-growth {
  color: #c62828;
}

.growth-rate.positive-growth {
  color: #ef6c00;
}

.growth-rate.negative-growth {
  color: #2e7d32;
}

.growth-rate.no-growth {
  color: #999;
}

.chart-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.chart-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.chart-hint {
  font-size: 13px;
  font-weight: 400;
  color: #999;
}

.chart-hint.selected {
  color: #f5576c;
}

.chart {
  height: 500px;
  width: 100%;
}

.prediction-section {
  margin-bottom: 30px;
}

.data-tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

@media (max-width: 1024px) {
  .data-tables {
    grid-template-columns: 1fr;
  }
}

.table-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.table-container h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  background: #f8f9fa;
}

.data-table td {
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

.data-table tbody tr.row-selected {
  background: rgba(245, 87, 108, 0.05);
}

.data-table tbody tr.row-selected td {
  font-weight: 600;
}

.progress-bar {
  position: relative;
  width: 100px;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.progress-fill.normal {
  background: linear-gradient(90deg, #66bb6a, #43a047);
}

.progress-fill.warning {
  background: linear-gradient(90deg, #ffa726, #f57c00);
}

.progress-fill.danger {
  background: linear-gradient(90deg, #ef5350, #e53935);
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.footer {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}
</style>
