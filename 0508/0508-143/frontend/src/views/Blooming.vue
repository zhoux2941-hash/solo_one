<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>花期预测</span>
              <div>
                <el-button type="success" @click="handleAddTemperature" :icon="Plus">
                  录入温度
                </el-button>
                <el-button @click="loadData" :icon="Refresh">
                  刷新预测
                </el-button>
              </div>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6" v-for="prediction in predictions" :key="prediction.nectarSourceId">
              <el-card class="blooming-card" :body-style="{ padding: '15px' }">
                <div class="source-name">{{ prediction.nectarSourceName }}</div>
                <el-tag :type="prediction.status === '已开花' ? 'success' : 'primary'">
                  {{ prediction.season }}
                </el-tag>
                <div class="progress-wrapper">
                  <el-progress 
                    :percentage="Math.round(prediction.progress)" 
                    :status="prediction.status === '已开花' ? 'success' : ''"
                    :stroke-width="12"
                  />
                </div>
                <div class="status-badge" :class="prediction.status === '已开花' ? 'status-blooming' : 'status-predicting'">
                  {{ prediction.status }}
                </div>
                <div class="date-info">
                  <div>
                    <span class="label">已累积</span>
                    <span class="value">{{ Math.round(prediction.accumulatedDegreeDays) }}°C</span>
                  </div>
                  <div>
                    <span class="label">还需</span>
                    <span class="value">{{ Math.round(prediction.remainingDegreeDays) }}°C</span>
                  </div>
                  <div>
                    <span class="label">预测开花日</span>
                    <span class="value">{{ prediction.predictedStartDate }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <template #header>
            <span>算法说明</span>
          </template>
          <div class="algorithm-info">
            <el-timeline>
              <el-timeline-item timestamp="近期权重优先" placement="top">
                最近7天温度数据权重递增，越新的数据影响越大
              </el-timeline-item>
              <el-timeline-item timestamp="温度趋势检测" placement="top">
                比较前后半周积温变化，降温自动降低预测效率
              </el-timeline-item>
              <el-timeline-item timestamp="倒春寒检测" placement="top">
                连续3天低于基点温度且下降5°C以上触发
              </el-timeline-item>
              <el-timeline-item timestamp="实时计算" placement="top">
                每次请求都重新计算，无缓存延迟
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>花期日历</span>
              <div>
                <el-button @click="prevMonth">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <span style="margin: 0 15px; font-weight: 600">{{ currentMonthLabel }}</span>
                <el-button @click="nextMonth">
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
          <div class="calendar">
            <div class="calendar-header">
              <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
            </div>
            <div class="calendar-body">
              <div 
                v-for="(day, index) in calendarDays" 
                :key="index" 
                class="calendar-day"
                :class="{
                  'other-month': !day.isCurrentMonth,
                  'today': day.isToday,
                  'blooming': day.bloomingEvents?.length > 0
                }"
              >
                <div class="day-number">{{ day.date.getDate() }}</div>
                <div v-for="event in day.bloomingEvents" :key="event.name" class="event-tag" :class="event.type">
                  {{ event.name }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>积温进度</span>
            </div>
          </template>
          <div ref="barRef" style="width: 100%; height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="tempDialogVisible" title="录入温度数据" width="500px">
      <el-form :model="tempForm" :rules="tempRules" ref="tempFormRef" label-width="100px">
        <el-form-item label="日期" prop="recordDate">
          <el-date-picker
            v-model="tempForm.recordDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最高温度" prop="maxTemperature">
              <el-input-number v-model="tempForm.maxTemperature" :precision="1" :min="-30" :max="50" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低温度" prop="minTemperature">
              <el-input-number v-model="tempForm.minTemperature" :precision="1" :min="-30" :max="50" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="位置">
          <el-input v-model="tempForm.location" placeholder="蜂场位置（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tempDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitTemperature">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getAllBloomingPredictions, initNectarSources } from '@/api/blooming'
import { upsertTemperatureRecord } from '@/api/temperature'

const predictions = ref([])
const currentDate = ref(new Date())
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const barRef = ref(null)
let chart = null

const tempDialogVisible = ref(false)
const tempFormRef = ref(null)
const tempForm = ref({
  recordDate: new Date().toISOString().split('T')[0],
  maxTemperature: null,
  minTemperature: null,
  location: ''
})

const tempRules = {
  recordDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  maxTemperature: [{ required: true, message: '请输入最高温度', trigger: 'blur' }],
  minTemperature: [{ required: true, message: '请输入最低温度', trigger: 'blur' }]
}

const currentMonthLabel = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}年${month}月`
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const today = new Date()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const days = []
  
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
      isToday: false,
      bloomingEvents: []
    })
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    const isToday = date.toDateString() === today.toDateString()
    const bloomingEvents = getBloomingEventsForDate(date)
    
    days.push({
      date,
      isCurrentMonth: true,
      isToday,
      bloomingEvents
    })
  }
  
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
      isToday: false,
      bloomingEvents: []
    })
  }
  
  return days
})

function getBloomingEventsForDate(date) {
  const events = []
  const dateStr = date.toISOString().split('T')[0]
  
  for (const p of predictions.value) {
    const startDate = new Date(p.predictedStartDate)
    const endDate = new Date(p.predictedEndDate)
    const currentDateStr = date.toISOString().split('T')[0]
    
    if (currentDateStr >= p.predictedStartDate && currentDateStr <= p.predictedEndDate) {
      if (currentDateStr === p.predictedStartDate) {
        events.push({ name: `${p.nectarSourceName}始`, type: 'start' })
      } else if (currentDateStr === p.predictedEndDate) {
        events.push({ name: `${p.nectarSourceName}末`, type: 'end' })
      } else {
        events.push({ name: p.nectarSourceName, type: 'blooming' })
      }
    }
  }
  
  return events
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

async function loadData() {
  try {
    try {
      await initNectarSources()
    } catch (e) {
    }
    
    predictions.value = await getAllBloomingPredictions()
    await nextTick()
    renderBarChart()
  } catch (error) {
    console.error('加载花期预测失败', error)
  }
}

function handleAddTemperature() {
  tempForm.value = {
    recordDate: new Date().toISOString().split('T')[0],
    maxTemperature: null,
    minTemperature: null,
    location: ''
  }
  tempDialogVisible.value = true
}

async function handleSubmitTemperature() {
  try {
    await tempFormRef.value.validate()
    
    await upsertTemperatureRecord(tempForm.value)
    ElMessage.success('温度数据保存成功')
    tempDialogVisible.value = false
    loadData()
  } catch (error) {
    if (error !== false) {
      console.error('保存温度数据失败', error)
    }
  }
}

function renderBarChart() {
  if (!barRef.value || predictions.value.length === 0) return
  
  chart = echarts.init(barRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['已累积积温', '剩余积温']
    },
    xAxis: {
      type: 'category',
      data: predictions.value.map(p => p.nectarSourceName)
    },
    yAxis: {
      type: 'value',
      name: '积温(°C)'
    },
    series: [
      {
        name: '已累积积温',
        type: 'bar',
        stack: 'total',
        data: predictions.value.map(p => p.accumulatedDegreeDays),
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '剩余积温',
        type: 'bar',
        stack: 'total',
        data: predictions.value.map(p => p.remainingDegreeDays),
        itemStyle: { color: '#909399' }
      }
    ]
  })

  window.addEventListener('resize', () => chart?.resize())
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.blooming-card {
  text-align: center;
  margin-bottom: 20px;
}

.source-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.progress-wrapper {
  margin: 20px 0;
}

.status-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 15px;
}

.status-blooming {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-predicting {
  background-color: #ecf5ff;
  color: #409eff;
}

.date-info {
  text-align: left;
}

.date-info > div {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
}

.label {
  color: #909399;
  font-size: 14px;
}

.value {
  font-weight: 500;
  color: #333;
}

.calendar {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.weekday {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  color: #606266;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  min-height: 100px;
  padding: 8px;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.other-month {
  background-color: #fafafa;
  color: #c0c4cc;
}

.today {
  background-color: #ecf5ff;
}

.blooming {
  background-color: #f0f9eb;
}

.day-number {
  font-weight: 500;
  margin-bottom: 5px;
}

.event-tag {
  display: block;
  font-size: 12px;
  padding: 2px 6px;
  margin: 2px 0;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-tag.start {
  background-color: #67c23a;
  color: #fff;
}

.event-tag.end {
  background-color: #f56c6c;
  color: #fff;
}

.event-tag.blooming {
  background-color: #909399;
  color: #fff;
}
</style>
