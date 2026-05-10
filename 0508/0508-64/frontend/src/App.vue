<template>
  <div class="app-container">
    <el-container>
      <el-header class="header">
        <h1>🚌 公交公司司机疲劳状态动态排班系统</h1>
      </el-header>
      
      <el-main>
        <el-row :gutter="20">
          <el-col :span="16">
            <SchedulingPanel 
              @scheduled="handleScheduled"
              @reset="handleReset"
            />
          </el-col>
          
          <el-col :span="8">
            <EnergyPanel :drivers="driverEnergies" ref="energyPanel" />
          </el-col>
        </el-row>
        
        <ScheduleTable 
          :schedules="schedules" 
          :drivers="drivers"
          :timeSlots="timeSlots"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { driverApi, schedulingApi } from './utils/api'
import SchedulingPanel from './components/SchedulingPanel.vue'
import EnergyPanel from './components/EnergyPanel.vue'
import ScheduleTable from './components/ScheduleTable.vue'

const drivers = ref([])
const driverEnergies = ref([])
const schedules = ref([])
const timeSlots = ref([])
const energyPanel = ref(null)

const loadDrivers = async () => {
  try {
    const res = await driverApi.getAll()
    drivers.value = res.data
  } catch (error) {
    console.error('加载司机列表失败', error)
  }
}

const loadEnergies = async () => {
  try {
    const res = await driverApi.getEnergies()
    driverEnergies.value = res.data
  } catch (error) {
    console.error('加载精力值失败', error)
  }
}

const loadTodaySchedules = async () => {
  try {
    const res = await schedulingApi.getToday()
    schedules.value = res.data
    updateTimeSlots()
  } catch (error) {
    console.error('加载今日排班失败', error)
  }
}

const updateTimeSlots = () => {
  const slots = new Set()
  schedules.value.forEach(s => {
    slots.add(`${s.timeSlotStart}-${s.timeSlotEnd}`)
  })
  timeSlots.value = Array.from(slots).sort()
}

const handleScheduled = (result) => {
  schedules.value = result.schedules || []
  driverEnergies.value = result.driverEnergies || []
  updateTimeSlots()
  if (result.warnings && result.warnings.length > 0) {
    alert('警告：\n' + result.warnings.join('\n'))
  }
}

const handleReset = async () => {
  try {
    await schedulingApi.reset()
    schedules.value = []
    timeSlots.value = []
    await loadEnergies()
  } catch (error) {
    console.error('重置失败', error)
  }
}

onMounted(async () => {
  await loadDrivers()
  await loadEnergies()
  await loadTodaySchedules()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #f5f7fa;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.app-container {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
}

.el-main {
  padding: 24px;
}
</style>
