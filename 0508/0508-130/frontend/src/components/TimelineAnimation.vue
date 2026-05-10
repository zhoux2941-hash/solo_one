<template>
  <div class="timeline-animation">
    <div class="control-panel">
      <div class="status-badge" :class="currentFrame?.status?.toLowerCase()">
        <el-icon><CircleCheckFilled v-if="currentFrame?.status === 'NORMAL'" />
        <el-icon><Warning v-else-if="currentFrame?.status === 'WARNING'" />
        <el-icon><CircleCloseFilled v-else />
        </el-icon>
        <span>{{ getStatusText(currentFrame?.status) }}</span>
      </div>
      
      <div class="controls">
        <el-button-group>
          <el-button @click="skipToStart">
            <el-icon><VideoPause /></el-icon>
          </el-button>
          <el-button @click="stepBackward" :disabled="currentDay <= 1">
            <el-icon><DArrowLeft /></el-icon>
          </el-button>
          <el-button @click="togglePlay" :type="isPlaying ? 'warning' : 'success'">
            <el-icon><VideoPause v-if="isPlaying" />
            <el-icon><VideoPlay v-else /></el-icon>
          </el-button>
          <el-button @click="stepForward" :disabled="currentDay >= totalDays">
            <el-icon><DArrowRight /></el-icon>
          </el-button>
          <el-button @click="skipToEnd">
            <el-icon><VideoPlay /></el-icon>
          </el-button>
        </el-button-group>
        
        <div class="speed-control">
          <span class="speed-label">速度:</span>
          <el-radio-group v-model="speed" size="small">
            <el-radio-button :value="0.5">0.5x</el-radio-button>
            <el-radio-button :value="1">1x</el-radio-button>
            <el-radio-button :value="2">2x</el-radio-button>
            <el-radio-button :value="4">4x</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <div class="day-info">
        <span class="current-day">第 {{ currentDay }} 天</span>
        <span class="total-days">/ {{ totalDays }}</span>
      </div>
    </div>
    
    <div class="timeline-bar">
      <div class="timeline-track">
        <div 
          v-for="event in keyEvents" 
          :key="event.day + event.type"
          class="event-marker"
          :class="event.level?.toLowerCase()"
          :style="{ left: getEventPosition(event.day) + '%' }"
          :title="event.description"
          @mouseenter="showEventTooltip(event, $event)"
          @mouseleave="hideEventTooltip"
        />
        
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        
        <div 
          class="playhead" 
          :style="{ left: progressPercent + '%' }"
        >
          <div class="playhead-dot"></div>
          <div class="playhead-line"></div>
        </div>
      </div>
      
      <div class="timeline-labels">
        <span v-for="i in timelineLabels" :key="i" class="label">
          {{ i }}天
        </span>
      </div>
    </div>
    
    <div class="main-content">
      <div class="stock-visualization">
        <div class="stock-header">
          <el-icon><Box /></el-icon>
          <span>实时库存状态</span>
          <span class="frame-message">{{ currentFrame?.message }}</span>
        </div>
        
        <div class="stock-bars">
          <div class="stock-item" v-for="item in stockItems" :key="item.key">
            <div class="stock-info">
              <div class="stock-icon" :style="{ background: item.color }">
                <el-icon>{{ item.icon }}</el-icon>
              </div>
              <div class="stock-details">
                <div class="stock-name">{{ item.label }}</div>
                <div class="stock-value">
                  <span class="current">{{ item.current?.toLocaleString() || 0 }}</span>
                  <span class="max">/ {{ item.max?.toLocaleString() || 0 }}</span>
                </div>
              </div>
            </div>
            <div class="stock-bar-container">
              <div class="stock-bar">
                <div 
                  class="stock-bar-fill" 
                  :style="{ width: item.percent + '%', background: item.color }"
                  :class="{ 'animated': isPlaying }"
                >
                  <div class="stock-bar-glow" :style="{ background: item.color }"></div>
                </div>
              </div>
              <div class="consumption-indicator" v-if="item.consumed > 0">
                <el-icon><ArrowDown /></el-icon>
                <span>-{{ item.consumed?.toLocaleString() }}</span>
              </div>
              <div class="delivery-indicator" v-if="item.delivered > 0">
                <el-icon><ArrowUp /></el-icon>
                <span>+{{ item.delivered?.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="events-panel">
        <div class="events-header">
          <el-icon><AlarmClock /></el-icon>
          <span>事件时间线</span>
        </div>
        <div class="events-list" ref="eventsListRef">
          <div 
            v-for="event in eventsUpToCurrent" 
            :key="event.day + '-' + eventsUpToCurrent.indexOf(event)"
            class="event-item"
            :class="[event.level?.toLowerCase(), event.type?.toLowerCase()]"
          >
            <div class="event-day">第{{ event.day }}天</div>
            <div class="event-content">
              <el-icon class="event-icon">
                <Truck v-if="event.type === 'DELIVERY'" />
                <Warning v-else-if="event.type === 'WARNING'" />
                <CircleCloseFilled v-else-if="event.type === 'SHORTAGE'" />
                <InfoFilled v-else />
              </el-icon>
              <span class="event-desc">{{ event.description }}</span>
            </div>
          </div>
          <el-empty v-if="eventsUpToCurrent.length === 0" description="暂无事件" :image-size="60" />
        </div>
      </div>
    </div>
    
    <div class="chart-section">
      <div ref="stockChartRef" class="stock-chart"></div>
    </div>
    
    <el-tooltip 
      v-model="tooltipVisible"
      :content="tooltipContent"
      placement="top"
      trigger="manual"
      :offset="10"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const props = defineProps({
  timelineData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['frameChange', 'playStateChange'])

const isPlaying = ref(false)
const currentDay = ref(1)
const speed = ref(1)
const tooltipVisible = ref(false)
const tooltipContent = ref('')
const eventsListRef = ref(null)
const stockChartRef = ref(null)
let chartInstance = null
let playInterval = null

const totalDays = computed(() => props.timelineData?.simulationDays || 0)
const frames = computed(() => props.timelineData?.frames || [])
const events = computed(() => props.timelineData?.events || [])
const dailyRate = computed(() => props.timelineData?.dailyConsumptionRate || {})

const currentFrame = computed(() => {
  return frames.value[currentDay.value - 1] || null
})

const progressPercent = computed(() => {
  return totalDays.value > 0 ? ((currentDay.value - 1) / (totalDays.value - 1)) * 100 : 0
})

const keyEvents = computed(() => {
  return events.value.filter(e => e.type === 'DELIVERY' || e.type === 'SHORTAGE')
})

const eventsUpToCurrent = computed(() => {
  return events.value.filter(e => e.day <= currentDay.value)
})

const timelineLabels = computed(() => {
  if (totalDays.value <= 10) {
    return Array.from({ length: totalDays.value }, (_, i) => i + 1)
  }
  const step = Math.ceil(totalDays.value / 5)
  const labels = [1]
  for (let i = step; i < totalDays.value; i += step) {
    labels.push(i)
  }
  labels.push(totalDays.value)
  return labels
})

const initialStock = computed(() => {
  if (frames.value.length === 0) return {}
  const firstFrame = frames.value[0]
  return {
    tent: firstFrame.tentRemaining + firstFrame.tentConsumed,
    water: firstFrame.waterRemaining + firstFrame.waterConsumed,
    food: firstFrame.foodRemaining + firstFrame.foodConsumed,
    medical: firstFrame.medicalKitRemaining + firstFrame.medicalKitConsumed
  }
})

const stockItems = computed(() => {
  if (!currentFrame.value) return []
  
  const max = initialStock.value
  const curr = currentFrame.value
  
  return [
    {
      key: 'tent',
      label: '帐篷',
      icon: 'House',
      color: '#409EFF',
      current: curr.tentRemaining,
      max: Math.max(max.tent || 1, curr.tentRemaining || 0),
      percent: max.tent > 0 ? Math.max(0, (curr.tentRemaining / max.tent) * 100) : 0,
      consumed: curr.tentConsumed,
      delivered: curr.tentDelivered
    },
    {
      key: 'water',
      label: '饮用水',
      icon: 'CoffeeCup',
      color: '#67C23A',
      current: curr.waterRemaining,
      max: Math.max(max.water || 1, curr.waterRemaining || 0),
      percent: max.water > 0 ? Math.max(0, (curr.waterRemaining / max.water) * 100) : 0,
      consumed: curr.waterConsumed,
      delivered: curr.waterDelivered
    },
    {
      key: 'food',
      label: '食物',
      icon: 'ForkSpoon',
      color: '#E6A23C',
      current: curr.foodRemaining,
      max: Math.max(max.food || 1, curr.foodRemaining || 0),
      percent: max.food > 0 ? Math.max(0, (curr.foodRemaining / max.food) * 100) : 0,
      consumed: curr.foodConsumed,
      delivered: curr.foodDelivered
    },
    {
      key: 'medical',
      label: '医疗包',
      icon: 'FirstAidKit',
      color: '#F56C6C',
      current: curr.medicalKitRemaining,
      max: Math.max(max.medical || 1, curr.medicalKitRemaining || 0),
      percent: max.medical > 0 ? Math.max(0, (curr.medicalKitRemaining / max.medical) * 100) : 0,
      consumed: curr.medicalKitConsumed,
      delivered: curr.medicalKitDelivered
    }
  ]
})

const getStatusText = (status) => {
  const map = {
    'NORMAL': '供应正常',
    'WARNING': '库存紧张',
    'CRITICAL': '物资短缺'
  }
  return map[status] || '未知'
}

const getEventPosition = (day) => {
  return totalDays.value > 1 ? ((day - 1) / (totalDays.value - 1)) * 100 : 0
}

const togglePlay = () => {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

const play = () => {
  if (currentDay.value >= totalDays.value) {
    currentDay.value = 1
  }
  isPlaying.value = true
  emit('playStateChange', isPlaying.value)
  
  const intervalMs = 1000 / speed.value
  playInterval = setInterval(() => {
    if (currentDay.value < totalDays.value) {
      currentDay.value++
    } else {
      pause()
    }
  }, intervalMs)
}

const pause = () => {
  isPlaying.value = false
  emit('playStateChange', isPlaying.value)
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

const stepForward = () => {
  if (currentDay.value < totalDays.value) {
    currentDay.value++
  }
}

const stepBackward = () => {
  if (currentDay.value > 1) {
    currentDay.value--
  }
}

const skipToStart = () => {
  pause()
  currentDay.value = 1
}

const skipToEnd = () => {
  pause()
  currentDay.value = totalDays.value
}

const showEventTooltip = (event, e) => {
  tooltipContent.value = event.description
  tooltipVisible.value = true
}

const hideEventTooltip = () => {
  tooltipVisible.value = false
}

const renderChart = () => {
  if (!stockChartRef.value || frames.value.length === 0) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(stockChartRef.value)
  
  const days = frames.value.map(f => `第${f.day}天`)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['帐篷', '饮用水', '食物', '医疗包'],
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
      data: days,
      axisLabel: {
        interval: Math.ceil(days.length / 6),
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value) => {
          if (value >= 10000) return (value / 10000).toFixed(1) + '万'
          return value
        }
      }
    },
    series: [
      {
        name: '帐篷',
        type: 'line',
        smooth: true,
        data: frames.value.map(f => f.tentRemaining),
        itemStyle: { color: '#409EFF' },
        areaStyle: { opacity: 0.1 }
      },
      {
        name: '饮用水',
        type: 'line',
        smooth: true,
        data: frames.value.map(f => f.waterRemaining),
        itemStyle: { color: '#67C23A' },
        areaStyle: { opacity: 0.1 }
      },
      {
        name: '食物',
        type: 'line',
        smooth: true,
        data: frames.value.map(f => f.foodRemaining),
        itemStyle: { color: '#E6A23C' },
        areaStyle: { opacity: 0.1 }
      },
      {
        name: '医疗包',
        type: 'line',
        smooth: true,
        data: frames.value.map(f => f.medicalKitRemaining),
        itemStyle: { color: '#F56C6C' },
        areaStyle: { opacity: 0.1 }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

watch(currentDay, () => {
  emit('frameChange', currentFrame.value)
  nextTick(() => {
    if (eventsListRef.value) {
      eventsListRef.value.scrollTop = eventsListRef.value.scrollHeight
    }
  })
})

watch(speed, () => {
  if (isPlaying.value) {
    pause()
    play()
  }
})

watch(() => props.timelineData, () => {
  pause()
  currentDay.value = 1
  nextTick(() => {
    renderChart()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    renderChart()
  })
  
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

onUnmounted(() => {
  pause()
  chartInstance?.dispose()
})
</script>

<style scoped>
.timeline-animation {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.control-panel {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
}

.status-badge.normal {
  background: #f0f9eb;
  color: #67c23a;
}

.status-badge.warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-badge.critical {
  background: #fef0f0;
  color: #f56c6c;
}

.controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.speed-label {
  font-size: 13px;
  color: #606266;
}

.day-info {
  margin-left: auto;
  font-size: 16px;
}

.current-day {
  font-weight: 600;
  color: #409eff;
  font-size: 20px;
}

.total-days {
  color: #909399;
}

.timeline-bar {
  margin-bottom: 20px;
  padding: 10px 0;
}

.timeline-track {
  position: relative;
  height: 40px;
  background: #e4e7ed;
  border-radius: 20px;
  overflow: visible;
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 20px;
  opacity: 0.3;
  transition: width 0.3s;
}

.playhead {
  position: absolute;
  top: -10px;
  transform: translateX(-50%);
  z-index: 10;
  transition: left 0.3s;
}

.playhead-dot {
  width: 20px;
  height: 20px;
  background: #409eff;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.5);
}

.playhead-line {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 100px;
  background: #409eff;
  opacity: 0.5;
}

.event-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  cursor: pointer;
  z-index: 5;
  transition: transform 0.2s;
}

.event-marker:hover {
  transform: translate(-50%, -50%) scale(1.3);
}

.event-marker.success {
  background: #67c23a;
}

.event-marker.warning {
  background: #e6a23c;
}

.event-marker.danger {
  background: #f56c6c;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 10px;
}

.timeline-labels .label {
  font-size: 12px;
  color: #909399;
}

.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.stock-visualization {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.stock-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #303133;
}

.frame-message {
  margin-left: auto;
  font-weight: normal;
  font-size: 13px;
  color: #909399;
}

.stock-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stock-item {
  display: flex;
  align-items: stretch;
  gap: 16px;
}

.stock-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 180px;
  flex-shrink: 0;
}

.stock-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stock-details {
  flex: 1;
}

.stock-name {
  font-weight: 600;
  color: #303133;
}

.stock-value {
  font-size: 14px;
}

.stock-value .current {
  color: #303133;
  font-weight: 600;
}

.stock-value .max {
  color: #909399;
}

.stock-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stock-bar {
  height: 24px;
  background: #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
}

.stock-bar-fill {
  height: 100%;
  border-radius: 12px;
  position: relative;
  transition: width 0.5s ease-out;
}

.stock-bar-fill.animated {
  transition: width 0.1s linear;
}

.stock-bar-glow {
  position: absolute;
  right: 0;
  top: 0;
  width: 40px;
  height: 100%;
  opacity: 0.5;
  filter: blur(8px);
}

.consumption-indicator,
.delivery-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 4px;
}

.consumption-indicator {
  color: #f56c6c;
}

.delivery-indicator {
  color: #67c23a;
}

.events-panel {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.events-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #303133;
}

.events-list {
  flex: 1;
  max-height: 320px;
  overflow-y: auto;
}

.event-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 3px solid #dcdfe6;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.event-item.success {
  border-left-color: #67c23a;
  background: #f0f9eb;
}

.event-item.warning {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.event-item.danger {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.event-day {
  font-size: 12px;
  color: #909399;
}

.event-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.event-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.event-item.success .event-icon {
  color: #67c23a;
}

.event-item.warning .event-icon {
  color: #e6a23c;
}

.event-item.danger .event-icon {
  color: #f56c6c;
}

.event-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

.chart-section {
  margin-top: 20px;
}

.stock-chart {
  height: 300px;
  width: 100%;
}
</style>
