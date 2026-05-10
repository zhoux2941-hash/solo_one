<template>
  <div class="container">
    <div class="card">
      <h1 class="title">食堂剩菜回收量趋势预测</h1>
      
      <div class="control-panel">
        <div class="slider-container">
          <label class="slider-label">
            平滑系数 (α): <span class="alpha-value">{{ alpha.toFixed(2) }}</span>
          </label>
          <input 
            type="range" 
            v-model.number="alpha" 
            min="0.01" 
            max="0.99" 
            step="0.01"
            class="slider"
          />
          <div class="slider-ticks">
            <span>0.01</span>
            <span>0.50</span>
            <span>0.99</span>
          </div>
        </div>
        
        <div class="info-panel">
          <div class="info-item">
            <span class="info-label">历史数据</span>
            <span class="info-value">{{ historicalData.length }} 天</span>
          </div>
          <div class="info-item">
            <span class="info-label">特殊事件</span>
            <span class="info-value event-count">{{ events.length }} 个</span>
          </div>
          <div class="info-item">
            <span class="info-label">今日预测总量</span>
            <span class="info-value">{{ nextPrediction }}</span>
          </div>
        </div>
      </div>
      
      <div class="tips">
        <span class="tip-icon">💡</span>
        <span>点击图表上的数据点可以标注特殊事件（大型活动/菜品更换）</span>
      </div>
      
      <div class="chart-container">
        <div ref="chartRef" class="chart"></div>
      </div>
      
      <div class="legend">
        <div class="legend-item">
          <span class="legend-color actual"></span>
          <span>历史实际值</span>
        </div>
        <div class="legend-item">
          <span class="legend-color predicted"></span>
          <span>预测值（虚线）</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon">⭐</span>
          <span>特殊事件</span>
        </div>
      </div>
    </div>
    
    <div class="bottom-section">
      <div class="predictions-table" v-if="predictions.length > 0">
        <h3>未来3天预测详情</h3>
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>午餐 (kg)</th>
              <th>晚餐 (kg)</th>
              <th>总计 (kg)</th>
              <th>特殊事件</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(pred, index) in predictions" :key="index">
              <td>{{ formatDate(pred.date) }}</td>
              <td>{{ pred.lunch }}</td>
              <td>{{ pred.dinner }}</td>
              <td class="total">{{ pred.total }}</td>
              <td>
                <span v-if="getEventsForDate(pred.date).length > 0" class="event-badge">
                  {{ getEventsForDate(pred.date).map(e => e.eventType).join(', ') }}
                </span>
                <button class="btn-add-event" @click="openAddModalForDate(pred.date)">
                  + 添加事件
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="events-panel">
        <div class="events-header">
          <h3>特殊事件列表</h3>
          <button class="btn-add" @click="openAddModal()">
            + 新增事件
          </button>
        </div>
        <div class="events-list" v-if="events.length > 0">
          <div class="event-item" v-for="event in events" :key="event.id">
            <div class="event-info">
              <span class="event-type" :class="event.eventType === '大型活动' ? 'type-activity' : 'type-menu'">
                {{ event.eventType }}
              </span>
              <span class="event-date">{{ formatDate(event.eventDate) }}</span>
            </div>
            <div class="event-desc" v-if="event.description">{{ event.description }}</div>
            <div class="event-footer">
              <span class="event-factor">影响因子: {{ event.impactFactor }}</span>
              <div class="event-actions">
                <button class="btn-edit" @click="openEditModal(event)">编辑</button>
                <button class="btn-delete" @click="handleDeleteEvent(event)">删除</button>
              </div>
            </div>
          </div>
        </div>
        <div class="empty-events" v-else>
          暂无特殊事件，点击上方按钮添加
        </div>
      </div>
    </div>
    
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingEvent ? '编辑事件' : '添加特殊事件' }}</h3>
          <button class="btn-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>日期 *</label>
            <input 
              type="date" 
              v-model="eventForm.eventDate" 
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>事件类型 *</label>
            <div class="radio-group">
              <label class="radio-item">
                <input 
                  type="radio" 
                  v-model="eventForm.eventType" 
                  value="大型活动"
                />
                <span>🎪 大型活动</span>
                <span class="radio-hint">(人流量增加，剩菜约+30%)</span>
              </label>
              <label class="radio-item">
                <input 
                  type="radio" 
                  v-model="eventForm.eventType" 
                  value="菜品更换"
                />
                <span>🍽️ 菜品更换</span>
                <span class="radio-hint">(新菜品受欢迎，剩菜约-15%)</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>描述</label>
            <input 
              type="text" 
              v-model="eventForm.description" 
              class="form-input"
              placeholder="如：春季运动会、新菜单上线等"
            />
          </div>
          <div class="form-group">
            <label>影响因子</label>
            <div class="factor-input">
              <input 
                type="range" 
                v-model.number="eventForm.impactFactor" 
                min="0.5" 
                max="2.0" 
                step="0.05"
                class="factor-slider"
              />
              <span class="factor-value">{{ eventForm.impactFactor.toFixed(2) }}</span>
            </div>
            <div class="factor-tips">
              <span>小于1: 减少剩菜</span>
              <span>1: 无影响</span>
              <span>大于1: 增加剩菜</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-save" @click="handleSaveEvent" :disabled="!isFormValid">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { getPrediction, addEvent, updateEvent, deleteEvent } from './api/api.js'

const chartRef = ref(null)
let chart = null

const alpha = ref(0.3)
const historicalData = ref([])
const predictions = ref([])
const events = ref([])
const loading = ref(false)
let debounceTimer = null

const showModal = ref(false)
const editingEvent = ref(null)
const eventForm = ref({
  eventDate: '',
  eventType: '大型活动',
  description: '',
  impactFactor: 1.3
})

const isFormValid = computed(() => {
  return eventForm.value.eventDate && eventForm.value.eventType
})

const nextPrediction = computed(() => {
  if (predictions.value.length > 0) {
    return predictions.value[0].total + ' kg'
  }
  return '-'
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日 ${weekday}`
}

const formatDateForInput = (dateStr) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getEventsForDate = (dateStr) => {
  return events.value.filter(e => e.eventDate === dateStr)
}

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    window.addEventListener('resize', () => {
      chart && chart.resize()
    })
    
    chart.on('click', (params) => {
      if (params.componentType === 'series') {
        const dateIndex = params.dataIndex
        let targetDate = null
        
        if (dateIndex < historicalData.value.length) {
          targetDate = historicalData.value[dateIndex].date
        } else if (dateIndex < historicalData.value.length + predictions.value.length) {
          const predIndex = dateIndex - historicalData.value.length
          targetDate = predictions.value[predIndex].date
        }
        
        if (targetDate) {
          openAddModalForDate(targetDate)
        }
      }
    })
  }
}

const getEventMarkPoints = () => {
  const markPoints = []
  const dateValueMap = {}
  
  historicalData.value.forEach((d, i) => {
    dateValueMap[d.date] = { index: i, value: parseFloat(d.total) }
  })
  
  events.value.forEach(event => {
    const pointInfo = dateValueMap[event.eventDate]
    if (pointInfo) {
      markPoints.push({
        name: event.eventType,
        coord: [pointInfo.index, pointInfo.value],
        value: event.eventType,
        symbolSize: 12,
        itemStyle: {
          color: event.eventType === '大型活动' ? '#ef4444' : '#8b5cf6'
        },
        tooltip: {
          formatter: `<strong>${event.eventType}</strong><br/>${event.description || ''}<br/>影响因子: ${event.impactFactor}`
        }
      })
    }
  })
  
  return markPoints
}

const updateChart = () => {
  if (!chart) return
  
  const historicalDates = historicalData.value.map(d => formatDate(d.date))
  const predictionDates = predictions.value.map(d => formatDate(d.date))
  
  const allDates = [...historicalDates, ...predictionDates]
  
  const historicalLunch = historicalData.value.map(d => parseFloat(d.lunch))
  const historicalDinner = historicalData.value.map(d => parseFloat(d.dinner))
  const historicalTotal = historicalData.value.map(d => parseFloat(d.total))
  
  const predictionLunch = new Array(historicalData.value.length - 1).fill(null)
  const predictionDinner = new Array(historicalData.value.length - 1).fill(null)
  const predictionTotal = new Array(historicalData.value.length - 1).fill(null)
  
  if (historicalData.value.length > 0) {
    const lastHistorical = historicalData.value[historicalData.value.length - 1]
    predictionLunch.push(parseFloat(lastHistorical.lunch))
    predictionDinner.push(parseFloat(lastHistorical.dinner))
    predictionTotal.push(parseFloat(lastHistorical.total))
  }
  
  predictions.value.forEach(p => {
    predictionLunch.push(parseFloat(p.lunch))
    predictionDinner.push(parseFloat(p.dinner))
    predictionTotal.push(parseFloat(p.total))
  })
  
  const markPoints = getEventMarkPoints()
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151'
      },
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>'
        params.forEach(param => {
          if (param.value !== null && param.value !== undefined) {
            result += `${param.marker}${param.seriesName}: ${param.value.toFixed(2)} kg<br/>`
          }
        })
        result += '<br/><span style="color:#9ca3af;font-size:12px">点击添加事件标注</span>'
        return result
      }
    },
    legend: {
      show: false
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: allDates,
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: '重量 (kg)',
      nameTextStyle: {
        padding: [0, 40, 0, 0]
      }
    },
    series: [
      {
        name: '午餐实际',
        type: 'line',
        data: historicalLunch,
        lineStyle: {
          color: '#3b82f6',
          width: 2
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ])
        }
      },
      {
        name: '午餐预测',
        type: 'line',
        data: predictionLunch,
        lineStyle: {
          color: '#3b82f6',
          width: 2,
          type: 'dashed'
        },
        itemStyle: {
          color: '#3b82f6'
        },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '晚餐实际',
        type: 'line',
        data: historicalDinner,
        lineStyle: {
          color: '#10b981',
          width: 2
        },
        itemStyle: {
          color: '#10b981'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ])
        }
      },
      {
        name: '晚餐预测',
        type: 'line',
        data: predictionDinner,
        lineStyle: {
          color: '#10b981',
          width: 2,
          type: 'dashed'
        },
        itemStyle: {
          color: '#10b981'
        },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '总计实际',
        type: 'line',
        data: historicalTotal,
        lineStyle: {
          color: '#f59e0b',
          width: 3
        },
        itemStyle: {
          color: '#f59e0b'
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 40,
          data: markPoints,
          label: {
            show: true,
            formatter: '{b}',
            color: '#fff',
            fontSize: 10
          }
        }
      },
      {
        name: '总计预测',
        type: 'line',
        data: predictionTotal,
        lineStyle: {
          color: '#f59e0b',
          width: 3,
          type: 'dashed'
        },
        itemStyle: {
          color: '#f59e0b'
        },
        symbol: 'circle',
        symbolSize: 8
      }
    ]
  }
  
  chart.setOption(option, true)
}

const fetchData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    console.log('请求预测数据，alpha:', alpha.value)
    const response = await getPrediction(alpha.value, 3)
    console.log('收到响应:', response.data)
    historicalData.value = response.data.historical
    predictions.value = response.data.predictions
    events.value = response.data.events || []
    await nextTick()
    updateChart()
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

const debouncedFetchData = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    fetchData()
  }, 150)
}

watch(alpha, (newVal, oldVal) => {
  console.log('alpha 变化:', oldVal, '->', newVal)
  if (newVal !== oldVal) {
    debouncedFetchData()
  }
}, { immediate: false })

watch(eventForm, (newForm) => {
  if (newForm.eventType === '大型活动') {
    if (eventForm.value.impactFactor === 0.9) {
      eventForm.value.impactFactor = 1.3
    }
  } else if (newForm.eventType === '菜品更换') {
    if (eventForm.value.impactFactor === 1.3) {
      eventForm.value.impactFactor = 0.9
    }
  }
}, { deep: true })

const openAddModal = () => {
  editingEvent.value = null
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  eventForm.value = {
    eventDate: formatDateForInput(tomorrow),
    eventType: '大型活动',
    description: '',
    impactFactor: 1.3
  }
  showModal.value = true
}

const openAddModalForDate = (dateStr) => {
  editingEvent.value = null
  eventForm.value = {
    eventDate: formatDateForInput(dateStr),
    eventType: '大型活动',
    description: '',
    impactFactor: 1.3
  }
  showModal.value = true
}

const openEditModal = (event) => {
  editingEvent.value = event
  eventForm.value = {
    eventDate: formatDateForInput(event.eventDate),
    eventType: event.eventType,
    description: event.description || '',
    impactFactor: event.impactFactor
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingEvent.value = null
}

const handleSaveEvent = async () => {
  if (!isFormValid.value) return
  
  try {
    const eventData = {
      eventDate: eventForm.value.eventDate,
      eventType: eventForm.value.eventType,
      description: eventForm.value.description || null,
      impactFactor: eventForm.value.impactFactor
    }
    
    if (editingEvent.value) {
      await updateEvent(editingEvent.value.id, eventData)
    } else {
      await addEvent(eventData)
    }
    
    closeModal()
    fetchData()
  } catch (error) {
    console.error('保存事件失败:', error)
    alert('保存失败，请重试')
  }
}

const handleDeleteEvent = async (event) => {
  if (!confirm(`确定要删除"${event.eventType}"事件吗？`)) {
    return
  }
  
  try {
    await deleteEvent(event.id)
    fetchData()
  } catch (error) {
    console.error('删除事件失败:', error)
    alert('删除失败，请重试')
  }
}

onMounted(() => {
  initChart()
  fetchData()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
}

.title {
  text-align: center;
  font-size: 28px;
  color: #1f2937;
  margin-bottom: 30px;
  font-weight: 600;
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-bottom: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%);
  border-radius: 15px;
}

.tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  margin-bottom: 20px;
  background: #fef3c7;
  border-radius: 10px;
  font-size: 14px;
  color: #92400e;
}

.tip-icon {
  font-size: 18px;
}

.slider-container {
  flex: 1;
  min-width: 300px;
}

.slider-label {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 10px;
}

.alpha-value {
  color: #667eea;
  font-weight: 600;
  font-size: 20px;
}

.slider {
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: linear-gradient(90deg, #e5e7eb 0%, #667eea 100%);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.4);
}

.slider-ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12px;
  color: #6b7280;
}

.info-panel {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.info-item {
  text-align: center;
  padding: 10px 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-width: 100px;
}

.info-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 5px;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.event-count {
  color: #ef4444;
}

.chart-container {
  width: 100%;
  margin-bottom: 20px;
}

.chart {
  width: 100%;
  height: 450px;
  cursor: pointer;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.legend-color {
  width: 20px;
  height: 4px;
  border-radius: 2px;
}

.legend-color.actual {
  background: linear-gradient(90deg, #3b82f6, #10b981, #f59e0b);
}

.legend-color.predicted {
  background: repeating-linear-gradient(
    90deg,
    #3b82f6,
    #3b82f6 4px,
    transparent 4px,
    transparent 8px
  );
}

.legend-icon {
  font-size: 16px;
}

.bottom-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.predictions-table {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.predictions-table h3 {
  margin-bottom: 20px;
  color: #1f2937;
  font-size: 18px;
}

.predictions-table table {
  width: 100%;
  border-collapse: collapse;
}

.predictions-table th,
.predictions-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.predictions-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.predictions-table td {
  color: #4b5563;
}

.predictions-table td.total {
  font-weight: 600;
  color: #667eea;
}

.predictions-table tr:hover {
  background: #f9fafb;
}

.event-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 8px;
}

.btn-add-event {
  padding: 4px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add-event:hover {
  background: #5a67d8;
}

.events-panel {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.events-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.events-header h3 {
  color: #1f2937;
  font-size: 18px;
  margin: 0;
}

.btn-add {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add:hover {
  background: #5a67d8;
}

.events-list {
  max-height: 400px;
  overflow-y: auto;
}

.event-item {
  padding: 15px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 12px;
}

.event-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-type {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.event-type.type-activity {
  background: #fee2e2;
  color: #991b1b;
}

.event-type.type-menu {
  background: #ede9fe;
  color: #5b21b6;
}

.event-date {
  font-size: 13px;
  color: #6b7280;
}

.event-desc {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 10px;
}

.event-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-factor {
  font-size: 12px;
  color: #9ca3af;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-edit {
  background: #e0e7ff;
  color: #4338ca;
}

.btn-edit:hover {
  background: #c7d2fe;
}

.btn-delete {
  background: #fee2e2;
  color: #b91c1c;
}

.btn-delete:hover {
  background: #fecaca;
}

.empty-events {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 10px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.radio-item:hover {
  background: #f3f4f6;
}

.radio-item:has(input:checked) {
  background: #eef2ff;
  border-color: #667eea;
}

.radio-item input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.radio-item span {
  font-size: 14px;
  color: #374151;
}

.radio-hint {
  margin-left: auto;
  font-size: 12px !important;
  color: #9ca3af !important;
}

.factor-input {
  display: flex;
  align-items: center;
  gap: 15px;
}

.factor-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #10b981 0%, #6b7280 50%, #ef4444 100%);
  outline: none;
  -webkit-appearance: none;
}

.factor-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 2px solid #667eea;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.factor-value {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  min-width: 50px;
  text-align: center;
}

.factor-tips {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: #9ca3af;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-save:disabled {
  background: #c7d2fe;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .bottom-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
  }
  
  .info-panel {
    justify-content: center;
  }
  
  .chart {
    height: 350px;
  }
}
</style>
