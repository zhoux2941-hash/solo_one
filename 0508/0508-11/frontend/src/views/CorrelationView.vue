<template>
  <div class="correlation-view">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>总订单数</h3>
        <div class="value">{{ overview.totalOrders || 0 }}</div>
      </div>
      <div class="stat-card">
        <h3>客单价</h3>
        <div class="value">¥{{ (overview.averageOrderAmount || 0).toFixed(0) }}</div>
      </div>
      <div class="stat-card">
        <h3>相关系数</h3>
        <div class="value" :class="getCorrelationClass()">
          {{ regression.correlationCoefficient ? regression.correlationCoefficient.toFixed(2) : '-' }}
        </div>
      </div>
      <div class="stat-card">
        <h3>样本数</h3>
        <div class="value">{{ scatterData.totalSamples || 0 }}</div>
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <h2>🔗 等待时间 vs 订单金额</h2>
          <span class="badge badge-info" v-if="regression.interpretation" style="max-width: 400px;">
            {{ regression.interpretation }}
          </span>
        </div>
        <div class="action-buttons" style="gap: 8px;">
          <button class="btn" :class="days === 7 ? 'btn-primary' : 'btn-warning'" 
                  @click="days = 7; loadAllData();" style="padding: 8px 14px;">
            7天
          </button>
          <button class="btn" :class="days === 30 ? 'btn-primary' : 'btn-warning'" 
                  @click="days = 30; loadAllData();" style="padding: 8px 14px;">
            30天
          </button>
        </div>
      </div>
      <div ref="scatterChartRef" class="chart-container"></div>
      <div v-if="regression.equation" class="regression-info">
        <span>回归线方程: </span>
        <code>{{ regression.equation }}</code>
      </div>
    </div>

    <div class="card">
      <h2>📊 按等待时间分组统计</h2>
      <div ref="groupChartRef" class="chart-container"></div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
        <h2>💰 高价菜品分析（≥50元）</h2>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span>阈值(分钟):</span>
          <select v-model="waitThreshold" @change="loadHighPriceAnalysis">
            <option :value="15">15</option>
            <option :value="30">30</option>
            <option :value="45">45</option>
            <option :value="60">60</option>
          </select>
        </div>
      </div>
      <div ref="highPriceChartRef" class="chart-container"></div>
      <div v-if="highPriceData.interpretation" class="interpretation-box">
        <p><strong>分析结论：</strong></p>
        <p>{{ highPriceData.interpretation }}</p>
        <p v-if="highPriceData.ratioDifference != null">
          差异: <strong :class="highPriceData.ratioDifference > 0 ? 'text-positive' : 'text-negative'">
            {{ highPriceData.ratioDifference > 0 ? '+' : '' }}{{ highPriceData.ratioDifference.toFixed(1) }}%
          </strong>
        </p>
      </div>
    </div>

    <div class="card">
      <h2>🧪 模拟数据生成（测试用）</h2>
      <div style="display: flex; gap: 15px; flex-wrap: wrap;">
        <div class="form-group" style="flex: 1; min-width: 150px;">
          <label>数据条数</label>
          <input type="number" v-model.number="mockCount" min="10" max="1000" />
        </div>
        <div class="form-group" style="flex: 1; min-width: 200px;">
          <label>关联模式</label>
          <select v-model="mockCorrelation">
            <option :value="true">正相关（等待越久消费越高）</option>
            <option :value="false">随机分布</option>
          </select>
        </div>
        <div style="display: flex; align-items: flex-end;">
          <button class="btn btn-primary" @click="generateMockData" :disabled="generating">
            {{ generating ? '生成中...' : '生成模拟数据' }}
          </button>
        </div>
      </div>
      <div v-if="mockMessage" class="mock-message">
        {{ mockMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'

const days = ref(30)
const waitThreshold = ref(30)
const mockCount = ref(200)
const mockCorrelation = ref(true)
const generating = ref(false)
const mockMessage = ref('')

const overview = ref({})
const scatterData = ref({})
const groupData = ref({ groups: [] })
const highPriceData = ref({})
const regression = ref({})

const scatterChartRef = ref(null)
const groupChartRef = ref(null)
const highPriceChartRef = ref(null)

let scatterChart = null
let groupChart = null
let highPriceChart = null

const api = {
  correlation: {
    overview: (days, restaurantId = null) => {
      let url = `/api/correlation/overview?days=${days}`
      if (restaurantId) url += `&restaurantId=${restaurantId}`
      return fetch(url).then(r => r.json())
    },
    waitVsOrder: (days, restaurantId = null) => {
      let url = `/api/correlation/wait-vs-order?days=${days}`
      if (restaurantId) url += `&restaurantId=${restaurantId}`
      return fetch(url).then(r => r.json())
    },
    waitGroups: (days, restaurantId = null) => {
      let url = `/api/correlation/wait-groups?days=${days}`
      if (restaurantId) url += `&restaurantId=${restaurantId}`
      return fetch(url).then(r => r.json())
    },
    highPrice: (days, threshold, restaurantId = null) => {
      let url = `/api/correlation/high-price?days=${days}&threshold=${threshold}`
      if (restaurantId) url += `&restaurantId=${restaurantId}`
      return fetch(url).then(r => r.json())
    },
    generateMock: (count, positive, restaurantId = null) => {
      let url = `/api/correlation/mock/generate?count=${count}&positiveCorrelation=${positive}`
      if (restaurantId) url += `&restaurantId=${restaurantId}`
      return fetch(url, { method: 'POST' }).then(r => r.json())
    }
  }
}

const getRestaurantId = () => {
  return localStorage.getItem('restaurantId') || 1
}

const loadAllData = async () => {
  const rid = getRestaurantId()
  try {
    const [overviewRes, scatterRes, groupRes, highRes] = await Promise.all([
      api.correlation.overview(days.value, rid),
      api.correlation.waitVsOrder(days.value, rid),
      api.correlation.waitGroups(days.value, rid),
      api.correlation.highPrice(days.value, waitThreshold.value, rid)
    ])
    overview.value = overviewRes
    scatterData.value = scatterRes
    regression.value = scatterRes.regression || {}
    groupData.value = groupRes
    highPriceData.value = highRes

    await nextTick()
    renderScatterChart()
    renderGroupChart()
    renderHighPriceChart()
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

const loadHighPriceAnalysis = async () => {
  const rid = getRestaurantId()
  try {
    const res = await api.correlation.highPrice(days.value, waitThreshold.value, rid)
    highPriceData.value = res
    await nextTick()
    renderHighPriceChart()
  } catch (e) {
    console.error('加载高价分析失败', e)
  }
}

const generateMockData = async () => {
  generating.value = true
  mockMessage.value = ''
  const rid = getRestaurantId()
  try {
    const res = await api.correlation.generateMock(mockCount.value, mockCorrelation.value, rid)
    mockMessage.value = res.message
    await loadAllData()
  } catch (e) {
    mockMessage.value = '生成失败: ' + e.message
  } finally {
    generating.value = false
  }
}

const getCorrelationClass = () => {
  const r = regression.value.correlationCoefficient
  if (!r) return ''
  const abs = Math.abs(r)
  if (abs >= 0.7) return r > 0 ? 'text-positive' : 'text-negative'
  if (abs >= 0.4) return r > 0 ? 'text-positive-light' : 'text-negative-light'
  return ''
}

const renderScatterChart = () => {
  if (!scatterChartRef.value) return
  
  if (!scatterChart) {
    scatterChart = echarts.init(scatterChartRef.value)
  }

  const points = scatterData.value.scatterPoints || []
  
  if (points.length === 0) {
    scatterChart.setOption({
      title: { text: '暂无数据，请先生成模拟数据', left: 'center', top: 'center', textStyle: { color: '#999' } }
    })
    return
  }

  const scatterDataArr = points.map(p => [p.waitMinutes, p.orderAmount, p.itemCount])

  let regressionLineData = []
  if (regression.value.slope != null && regression.value.intercept != null) {
    const maxWait = Math.max(...points.map(p => p.waitMinutes))
    const minWait = Math.min(...points.map(p => p.waitMinutes))
    regressionLineData = [
      [minWait, regression.value.slope * minWait + regression.value.intercept],
      [maxWait, regression.value.slope * maxWait + regression.value.intercept]
    ]
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesType === 'scatter') {
          return `等待时间: ${params.value[0]} 分钟<br/>订单金额: ¥${params.value[1].toFixed(2)}<br/>菜品数: ${params.value[2]}`
        }
        return '回归线'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '等待时间(分钟)',
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    yAxis: {
      type: 'value',
      name: '订单金额(元)',
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    series: [
      {
        name: '订单数据',
        type: 'scatter',
        symbolSize: 10,
        data: scatterDataArr,
        itemStyle: {
          color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.8)' },
            { offset: 1, color: 'rgba(118, 75, 162, 0.8)' }
          ]),
          opacity: 0.7
        }
      },
      {
        name: '回归线',
        type: 'line',
        data: regressionLineData,
        lineStyle: {
          width: 3,
          color: '#f5576c',
          type: 'dashed'
        },
        symbol: 'none',
        smooth: false
      }
    ]
  }

  scatterChart.setOption(option)
}

const renderGroupChart = () => {
  if (!groupChartRef.value) return
  
  if (!groupChart) {
    groupChart = echarts.init(groupChartRef.value)
  }

  const groups = groupData.value.groups || []
  
  if (groups.length === 0) {
    groupChart.setOption({
      title: { text: '暂无分组数据', left: 'center', top: 'center', textStyle: { color: '#999' } }
    })
    return
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['订单数', '平均金额', '平均菜品数'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: groups.map(g => g.waitGroup)
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left'
      },
      {
        type: 'value',
        name: '金额(元)/数量',
        position: 'right'
      }
    ],
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: groups.map(g => g.orderCount),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        }
      },
      {
        name: '平均金额',
        type: 'line',
        yAxisIndex: 1,
        data: groups.map(g => g.avgAmount.toFixed(0)),
        lineStyle: { width: 3, color: '#11998e' },
        itemStyle: { color: '#11998e' }
      },
      {
        name: '平均菜品数',
        type: 'line',
        yAxisIndex: 1,
        data: groups.map(g => g.avgItemCount.toFixed(1)),
        lineStyle: { width: 3, color: '#f093fb' },
        itemStyle: { color: '#f093fb' }
      }
    ]
  }

  groupChart.setOption(option)
}

const renderHighPriceChart = () => {
  if (!highPriceChartRef.value) return
  
  if (!highPriceChart) {
    highPriceChart = echarts.init(highPriceChartRef.value)
  }

  const longWait = highPriceData.value.longWaitStats
  const shortWait = highPriceData.value.shortWaitStats

  if (!longWait && !shortWait) {
    highPriceChart.setOption({
      title: { text: '暂无高价菜品分析数据', left: 'center', top: 'center', textStyle: { color: '#999' } }
    })
    return
  }

  const categories = []
  const highPriceDataArr = []
  const normalPriceDataArr = []

  if (shortWait) {
    categories.push(`等待<${waitThreshold.value}分钟`)
    highPriceDataArr.push(shortWait.highPriceRatio)
    normalPriceDataArr.push(100 - shortWait.highPriceRatio)
  }
  if (longWait) {
    categories.push(`等待≥${waitThreshold.value}分钟`)
    highPriceDataArr.push(longWait.highPriceRatio)
    normalPriceDataArr.push(100 - longWait.highPriceRatio)
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}<br/>{a0}: {c0}%<br/>{a1}: {c1}%'
    },
    legend: {
      data: ['高价菜品(≥50元)', '普通菜品'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: {
      type: 'value',
      name: '占比(%)',
      max: 100
    },
    series: [
      {
        name: '高价菜品(≥50元)',
        type: 'bar',
        stack: 'total',
        data: highPriceDataArr,
        itemStyle: { color: '#f5576c' }
      },
      {
        name: '普通菜品',
        type: 'bar',
        stack: 'total',
        data: normalPriceDataArr,
        itemStyle: { color: '#667eea' }
      }
    ]
  }

  highPriceChart.setOption(option)
}

const handleResize = () => {
  scatterChart?.resize()
  groupChart?.resize()
  highPriceChart?.resize()
}

onMounted(() => {
  loadAllData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  scatterChart?.dispose()
  groupChart?.dispose()
  highPriceChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.correlation-view {
}

.regression-info {
  margin-top: 15px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.regression-info code {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  color: #667eea;
}

.badge-info {
  background: #e7f3ff;
  color: #004085;
  font-size: 13px;
  white-space: normal;
}

.interpretation-box {
  margin-top: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  font-size: 14px;
  color: #333;
}

.interpretation-box p {
  margin: 5px 0;
}

.text-positive {
  color: #11998e;
  font-weight: 600;
}

.text-negative {
  color: #eb3349;
  font-weight: 600;
}

.text-positive-light {
  color: #38ef7d;
}

.text-negative-light {
  color: #f45c43;
}

.mock-message {
  margin-top: 15px;
  padding: 12px;
  background: #d4edda;
  color: #155724;
  border-radius: 8px;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
