<template>
  <el-card class="schedule-table">
    <template #header>
      <div class="card-header">
        <span>📅 今日排班表</span>
        <span class="date">{{ todayStr }}</span>
      </div>
    </template>
    
    <el-table 
      :data="tableData" 
      border 
      stripe 
      style="width: 100%;"
      :empty-text="'暂无排班数据，请先生成排班'"
    >
      <el-table-column 
        prop="driverName" 
        label="司机" 
        width="140"
        fixed="left"
      >
        <template #default="scope">
          <div class="driver-cell">
            <span class="name">{{ scope.row.driverName }}</span>
            <span class="number">{{ scope.row.driverNumber }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column 
        v-for="slot in sortedSlots" 
        :key="slot" 
        :label="formatSlotLabel(slot)" 
        align="center"
        min-width="120"
      >
        <template #default="scope">
          <div v-if="getScheduleStatus(scope.row, slot)" class="schedule-cell driving">
            <span class="status-icon">🚗</span>
            <span class="status-text">值勤</span>
          </div>
          <div v-else class="schedule-cell rest">
            <span class="status-icon">☕</span>
            <span class="status-text">休息</span>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <el-divider content-position="left">排班详情</el-divider>
    
    <el-timeline v-if="schedules && schedules.length > 0">
      <el-timeline-item
        v-for="(schedule, index) in sortedSchedules"
        :key="schedule.scheduleId"
        :timestamp="formatTime(schedule.timeSlotStart, schedule.timeSlotEnd)"
        placement="top"
        :type="index % 2 === 0 ? 'primary' : 'success'"
      >
        <el-card :body-style="{ padding: '12px' }" class="detail-card">
          <div class="detail-row">
            <span class="label">司机：</span>
            <span class="value">{{ schedule.driverName }} ({{ schedule.driverNumber }})</span>
          </div>
          <div class="detail-row">
            <span class="label">时段：</span>
            <span class="value">{{ formatTime(schedule.timeSlotStart, schedule.timeSlotEnd) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">精力变化：</span>
            <span class="value energy">
              {{ schedule.energyBefore }} → 
              <span class="energy-after" :class="{ 'danger': schedule.energyAfter < 30 }">
                {{ schedule.energyAfter }}
              </span>
              <span class="delta">(-{{ schedule.energyBefore - schedule.energyAfter }})</span>
            </span>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    
    <el-empty v-else description="暂无排班记录" :image-size="100" />
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  schedules: {
    type: Array,
    default: () => []
  },
  drivers: {
    type: Array,
    default: () => []
  },
  timeSlots: {
    type: Array,
    default: () => []
  }
})

const todayStr = computed(() => {
  const today = new Date()
  return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
})

const sortedSlots = computed(() => {
  return [...props.timeSlots].sort()
})

const sortedSchedules = computed(() => {
  return [...props.schedules].sort((a, b) => {
    if (a.timeSlotStart !== b.timeSlotStart) {
      return a.timeSlotStart.localeCompare(b.timeSlotStart)
    }
    return a.driverNumber.localeCompare(b.driverNumber)
  })
})

const tableData = computed(() => {
  if (props.drivers.length === 0) return []
  
  const scheduleMap = new Map()
  props.schedules.forEach(s => {
    const key = `${s.driverId}_${s.timeSlotStart}-${s.timeSlotEnd}`
    scheduleMap.set(key, s)
  })
  
  return props.drivers.map(d => ({
    driverId: d.id,
    driverName: d.name,
    driverNumber: d.driverNumber,
    scheduleMap: scheduleMap
  }))
})

const getScheduleStatus = (row, slot) => {
  const key = `${row.driverId}_${slot}`
  return row.scheduleMap.has(key)
}

const formatSlotLabel = (slot) => {
  const [start, end] = slot.split('-')
  return `${start} - ${end}`
}

const formatTime = (start, end) => {
  return `${start} - ${end}`
}
</script>

<style scoped>
.schedule-table {
  margin-top: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.date {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}

.driver-cell {
  display: flex;
  flex-direction: column;
}

.driver-cell .name {
  font-weight: 600;
  color: #303133;
}

.driver-cell .number {
  font-size: 12px;
  color: #909399;
}

.schedule-cell {
  padding: 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.schedule-cell.driving {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  color: #409eff;
}

.schedule-cell.rest {
  background: #f5f7fa;
  color: #909399;
}

.status-icon {
  font-size: 16px;
}

.status-text {
  font-size: 13px;
  font-weight: 500;
}

.detail-card {
  margin-bottom: 8px;
}

.detail-row {
  display: flex;
  margin-bottom: 4px;
  font-size: 14px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row .label {
  color: #909399;
  min-width: 70px;
}

.detail-row .value {
  color: #303133;
  font-weight: 500;
}

.energy-after {
  color: #67c23a;
  font-weight: 600;
}

.energy-after.danger {
  color: #f56c6c;
}

.delta {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}
</style>
