<template>
  <div class="compare-instruments">
    <h2>琴音对比分析</h2>

    <div class="selection-section">
      <h3>选择要对比的古琴</h3>
      <div class="guqin-checkboxes">
        <label v-for="guqin in guqins" :key="guqin.id" class="checkbox-item">
          <input 
            type="checkbox" 
            :value="guqin.id" 
            v-model="selectedGuqinIds"
            @change="handleSelectionChange"
          />
          <span class="checkbox-label">
            <strong>{{ guqin.name }}</strong>
            <span class="subtext">(弦长: {{ guqin.stringLength }}mm)</span>
          </span>
        </label>
      </div>
      
      <div class="selection-actions">
        <button 
          @click="compareInstruments" 
          :disabled="selectedGuqinIds.length < 2"
          class="compare-btn"
        >
          对比选中的古琴 ({{ selectedGuqinIds.length }})
        </button>
        <button @click="clearSelection" class="clear-btn">
          清除选择
        </button>
      </div>
    </div>

    <div v-if="comparisonData.length > 0" class="results-section">
      <div class="chart-section">
        <h3>音准偏差曲线对比</h3>
        <div class="chart-container" ref="chartRef"></div>
      </div>

      <div class="stats-comparison">
        <h3>统计数据对比</h3>
        <div class="stats-grid">
          <div v-for="(data, index) in comparisonData" :key="data.guqinId" class="stats-card">
            <div class="stats-header" :style="{ borderColor: colors[index % colors.length] }">
              <h4>{{ data.guqinName }}</h4>
              <span class="data-point" :style="{ backgroundColor: colors[index % colors.length] }"></span>
            </div>
            <div v-if="data.hasData" class="stats-content">
              <div class="stat-row">
                <span class="stat-label">平均偏差</span>
                <span 
                  class="stat-value" 
                  :class="getDeviationClass(data.statistics?.average)"
                >
                  {{ data.statistics?.average > 0 ? '+' : '' }}{{ data.statistics?.average }} 音分
                </span>
              </div>
              <div class="stat-row">
                <span class="stat-label">最大偏差</span>
                <span 
                  class="stat-value" 
                  :class="getDeviationClass(data.statistics?.max)"
                >
                  {{ data.statistics?.max > 0 ? '+' : '' }}{{ data.statistics?.max }} 音分
                </span>
              </div>
              <div class="stat-row">
                <span class="stat-label">偏差范围</span>
                <span class="stat-value">
                  {{ data.statistics?.range }} 音分
                </span>
              </div>
              <div class="stat-row">
                <span class="stat-label">记录时间</span>
                <span class="stat-value small">
                  {{ formatDate(data.recordTime) }}
                </span>
              </div>
            </div>
            <div v-else class="no-data">
              <p>暂无调音记录</p>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-comparison">
        <h3>各徽位详细对比</h3>
        <div class="table-container">
          <table class="comparison-table">
            <thead>
              <tr>
                <th>徽位</th>
                <th v-for="(data, index) in comparisonData.filter(d => d.hasData)" :key="data.guqinId">
                  <span :style="{ color: colors[index % colors.length] }">
                    {{ data.guqinName }}
                  </span>
                  <br/>
                  <span class="subheader">(音分偏差)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="hui in 13" :key="hui">
                <td class="hui-cell">{{ hui }}徽</td>
                <td 
                  v-for="(data, index) in comparisonData.filter(d => d.hasData)" 
                  :key="data.guqinId"
                  :class="getDeviationClass(getDeviationForHui(data, hui))"
                >
                  <span v-if="getDeviationForHui(data, hui) !== null">
                    {{ getDeviationForHui(data, hui) > 0 ? '+' : '' }}{{ getDeviationForHui(data, hui) }}
                  </span>
                  <span v-else class="no-data-cell">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="analysis-section">
        <h3>分析建议</h3>
        <div class="analysis-content">
          <div v-for="(analysis, index) in analysisResults" :key="index" class="analysis-item">
            <h4 :style="{ color: colors[index % colors.length] }">{{ analysis.guqinName }}</h4>
            <ul>
              <li v-for="(tip, tipIndex) in analysis.tips" :key="tipIndex">
                {{ tip }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>请至少选择两张古琴进行对比</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { guqinApi, comparisonApi } from '../api'
import { generateTuningAdvice } from '../utils/huiPositionCalculator'

const guqins = ref([])
const selectedGuqinIds = ref([])
const comparisonData = ref([])
const chartRef = ref(null)
let chartInstance = null

const colors = ['#667eea', '#f56565', '#48bb78', '#ed8936', '#4299e1', '#9f7aea']

const analysisResults = computed(() => {
  return comparisonData.value
    .filter(d => d.hasData)
    .map(data => {
      const tips = []
      const details = data.curveData
      
      if (!details || details.length === 0) {
        return { guqinName: data.guqinName, tips: ['暂无足够数据进行分析'] }
      }

      const avgDev = parseFloat(data.statistics?.average || 0)
      
      if (Math.abs(avgDev) < 5) {
        tips.push('整体音准良好，各徽位偏差均在理想范围内')
      } else if (Math.abs(avgDev) < 15) {
        tips.push('整体音准基本合格，但部分徽位需要微调')
      } else {
        tips.push('整体偏差较大，建议进行系统性调音')
      }

      const hui7Dev = getDeviationForHui(data, 7)
      if (hui7Dev !== null && Math.abs(hui7Dev) > 15) {
        tips.push(generateTuningAdvice(hui7Dev, 7))
      }

      const highHuiDeviations = details.filter(d => d.huiNumber <= 6)
      const lowHuiDeviations = details.filter(d => d.huiNumber >= 8)
      
      const highHuiAvg = highHuiDeviations.length > 0 
        ? highHuiDeviations.reduce((sum, d) => sum + parseFloat(d.centDeviation), 0) / highHuiDeviations.length 
        : 0
      const lowHuiAvg = lowHuiDeviations.length > 0 
        ? lowHuiDeviations.reduce((sum, d) => sum + parseFloat(d.centDeviation), 0) / lowHuiDeviations.length 
        : 0

      if (Math.abs(highHuiAvg) > 20 && Math.abs(lowHuiAvg) < 10) {
        tips.push('岳山附近徽位偏差较大，可能需要调整岳山高度或琴面弧度')
      }

      if (Math.abs(lowHuiAvg) > 20 && Math.abs(highHuiAvg) < 10) {
        tips.push('龙龈附近徽位偏差较大，可能需要调整龙龈位置或琴面弧度')
      }

      return {
        guqinName: data.guqinName,
        tips
      }
    })
})

const loadGuqins = async () => {
  try {
    const response = await guqinApi.getList()
    if (response.success) {
      guqins.value = response.data
    }
  } catch (error) {
    console.error('加载古琴列表失败:', error)
  }
}

const handleSelectionChange = () => {
}

const clearSelection = () => {
  selectedGuqinIds.value = []
  comparisonData.value = []
}

const compareInstruments = async () => {
  if (selectedGuqinIds.value.length < 2) return

  try {
    const response = await comparisonApi.compareInstruments(selectedGuqinIds.value)
    if (response.success) {
      comparisonData.value = response.data
      await nextTick()
      initChart()
    }
  } catch (error) {
    console.error('对比失败:', error)
  }
}

const initChart = () => {
  if (!chartRef.value || comparisonData.value.length === 0) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const validData = comparisonData.value.filter(d => d.hasData)
  
  const series = validData.map((data, index) => ({
    name: data.guqinName,
    type: 'line',
    smooth: true,
    data: Array.from({ length: 13 }, (_, i) => {
      const huiData = data.curveData.find(d => d.huiNumber === i + 1)
      return huiData ? parseFloat(huiData.centDeviation) : null
    }),
    lineStyle: {
      color: colors[index % colors.length],
      width: 2
    },
    itemStyle: {
      color: colors[index % colors.length]
    }
  }))

  const option = {
    title: {
      text: '音准偏差曲线对比',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `<strong>${params[0].axisValue}</strong><br/>`
        params.forEach(param => {
          if (param.value !== null) {
            result += `${param.marker} ${param.seriesName}: ${param.value > 0 ? '+' : ''}${param.value.toFixed(2)} 音分<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: validData.map(d => d.guqinName),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 13 }, (_, i) => `${i + 1}徽`),
      name: '徽位'
    },
    yAxis: {
      type: 'value',
      name: '音分偏差',
      min: -50,
      max: 50,
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series
  }

  chartInstance.setOption(option)

  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

const getDeviationForHui = (data, huiNumber) => {
  if (!data.curveData) return null
  const huiData = data.curveData.find(d => d.huiNumber === huiNumber)
  return huiData ? parseFloat(huiData.centDeviation) : null
}

const getDeviationClass = (deviation) => {
  if (deviation === null || deviation === undefined) return ''
  const val = parseFloat(deviation)
  if (Math.abs(val) < 5) return 'good'
  if (Math.abs(val) < 15) return 'warning'
  return 'danger'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

watch(comparisonData, (newVal) => {
  if (newVal.length === 0 && chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

onMounted(() => {
  loadGuqins()
})
</script>

<style scoped>
.compare-instruments {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #667eea;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

h3 {
  color: #4a5568;
  margin: 0 0 1rem;
  font-size: 1.2rem;
}

h4 {
  color: #4a5568;
  margin: 0;
  font-size: 1rem;
}

.selection-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 8px;
}

.guqin-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox-item:hover {
  background: #edf2f7;
}

.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  flex-direction: column;
}

.checkbox-label .subtext {
  font-size: 0.8rem;
  color: #718096;
}

.selection-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.compare-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.compare-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-btn {
  padding: 0.75rem 1.5rem;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.chart-section {
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 8px;
}

.chart-container {
  height: 400px;
}

.stats-comparison {
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stats-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.stats-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: white;
  border-bottom: 3px solid #667eea;
}

.data-point {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.stats-content {
  padding: 1.25rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: #718096;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: bold;
  color: #4a5568;
}

.stat-value.small {
  font-size: 0.85rem;
  font-weight: normal;
}

.stat-value.good {
  color: #48bb78;
}

.stat-value.warning {
  color: #ed8936;
}

.stat-value.danger {
  color: #f56565;
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: #718096;
}

.detail-comparison {
}

.table-container {
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.comparison-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  text-align: center;
}

.comparison-table .subheader {
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: normal;
}

.comparison-table td {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 500;
}

.comparison-table tbody tr:hover {
  background: #f7fafc;
}

.comparison-table .hui-cell {
  background: #f7fafc;
  font-weight: bold;
  color: #4a5568;
}

.comparison-table td.good {
  color: #48bb78;
  background: rgba(72, 187, 120, 0.1);
}

.comparison-table td.warning {
  color: #ed8936;
  background: rgba(237, 137, 54, 0.1);
}

.comparison-table td.danger {
  color: #f56565;
  background: rgba(245, 101, 101, 0.1);
}

.no-data-cell {
  color: #a0aec0;
}

.analysis-section {
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 8px;
}

.analysis-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.analysis-item {
  background: white;
  padding: 1.25rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.analysis-item h4 {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.analysis-item ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.analysis-item li {
  padding: 0.5rem 0;
  color: #4a5568;
  font-size: 0.9rem;
  padding-left: 1.25rem;
  position: relative;
}

.analysis-item li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #667eea;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #718096;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  font-size: 1.1rem;
}
</style>
