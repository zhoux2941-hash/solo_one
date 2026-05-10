<template>
  <div class="gantt-chart">
    <div class="gantt-header">
      <div>机器</div>
      <div v-for="time in timeSlots" :key="time">{{ time }}</div>
    </div>
    
    <div v-for="machineId in [1, 2, 3]" :key="'machine-' + machineId" class="gantt-row">
      <div class="gantt-label">第 {{ machineId }} 台</div>
      <div
        v-for="time in timeSlots"
        :key="time + '-machine-' + machineId"
        class="gantt-cell"
        :class="getCellClass(machineId, time)"
        :title="getCellTitle(machineId, time)"
      ></div>
    </div>

    <div class="gantt-legend">
      <div class="legend-item">
        <span class="legend-color warmup"></span>
        <span>预热中</span>
      </div>
      <div class="legend-item">
        <span class="legend-color active"></span>
        <span>运行中</span>
      </div>
      <div class="legend-item">
        <span class="legend-color idle"></span>
        <span>空闲</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  schedules: {
    type: Array,
    required: true
  }
})

const timeSlots = computed(() => {
  const slots = []
  for (let hour = 17; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
    }
  }
  return slots
})

const getMachineSchedule = (machineId) => {
  return props.schedules.find(s => s.machineId === machineId)
}

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

const getCellClass = (machineId, timeSlot) => {
  const schedule = getMachineSchedule(machineId)
  if (!schedule) return ''

  const slotMinutes = timeToMinutes(timeSlot)
  const startMinutes = timeToMinutes(schedule.startTime)
  const endMinutes = timeToMinutes(schedule.endTime)

  if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
    const warmupEnd = startMinutes + 15
    if (slotMinutes < warmupEnd) {
      return 'warmup'
    }
    return 'active'
  }
  return ''
}

const getCellTitle = (machineId, timeSlot) => {
  const schedule = getMachineSchedule(machineId)
  if (!schedule) {
    return `${timeSlot}: 第 ${machineId} 台机器空闲`
  }

  const slotMinutes = timeToMinutes(timeSlot)
  const startMinutes = timeToMinutes(schedule.startTime)
  const endMinutes = timeToMinutes(schedule.endTime)

  if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
    const warmupEnd = startMinutes + 15
    if (slotMinutes < warmupEnd) {
      return `${timeSlot}: 第 ${machineId} 台机器预热中 (${schedule.startTime} - ${schedule.endTime})`
    }
    return `${timeSlot}: 第 ${machineId} 台机器运行中 (${schedule.startTime} - ${schedule.endTime})`
  }
  return `${timeSlot}: 第 ${machineId} 台机器空闲`
}
</script>

<style scoped>
.gantt-chart {
  min-width: 600px;
}

.gantt-legend {
  display: flex;
  gap: 30px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.warmup {
  background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%);
}

.legend-color.active {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
}

.legend-color.idle {
  background: #f1f3f5;
  border: 1px solid #dee2e6;
}
</style>
