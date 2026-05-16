<template>
  <div class="schedule-management">
    <div class="header">
      <h2>护士排班</h2>
      <div class="date-nav">
        <button @click="prevWeek" :disabled="canGoPrevWeek" :class="{ disabled: canGoPrevWeek }">&lt;</button>
        <span>{{ weekStart }} - {{ weekEnd }}</span>
        <button @click="nextWeek">&gt;</button>
      </div>
      <button @click="showAddModal = true" class="btn-add">+ 添加排班</button>
    </div>

    <div class="icu-status" :class="{ warning: !icuValidation.valid }">
      ICU护士验证: 
      <span v-if="icuValidation.valid">✅ 充足 ({{ icuValidation.icuNursesOnDuty }}/{{ icuValidation.requiredNurses })</span>
      <span v-else>⚠️ 不足 ({{ icuValidation.icuNursesOnDuty }}/{{ icuValidation.requiredNurses }})</span>
    </div>

    <div class="calendar">
      <div class="calendar-header">
        <div class="time-col"></div>
        <div v-for="day in weekDays" :key="day.key" class="day-header" :class="{ 'today-header': day.isToday }">
          <div class="day-name">{{ day.weekday }}</div>
          <div class="day-date">{{ day.date }}</div>
        </div>
      </div>

      <div class="calendar-body">
        <div v-for="shift in shifts" :key="shift.key" class="shift-row">
          <div class="shift-label">{{ shift.name }}</div>
          <div v-for="day in weekDays" :key="day.key" class="day-cell" 
             :class="{ 
               'drag-over': dragOverTarget.date === day.date && dragOverTarget.shift === shift.key,
               'past-date': day.isPast,
               'today': day.isToday
             }"
             @dragover.prevent="!day.isPast && handleDragOver($event, day.date, shift.key)"
             @dragleave="!day.isPast && handleDragLeave"
             @drop="!day.isPast && handleDrop($event, day.date, shift.key)">
            <div v-for="schedule in getSchedules(day.date, shift.key)" 
                 :key="schedule.id" 
                 class="schedule-item"
                 :class="{ dragging: draggingId === schedule.id, 'past-schedule': day.isPast }"
                 :draggable="!day.isPast"
                 @dragstart="!day.isPast && handleDragStart($event, schedule.id)"
                 @dragend="handleDragEnd">
              <div class="nurse-name">{{ schedule.nurse.name }}</div>
              <div class="nurse-badge" v-if="schedule.nurse.isIcuQualified">ICU</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pendingSwaps.length > 0" class="swap-requests">
      <h3>待审批换班请求 ({{ pendingSwaps.length }})</h3>
      <div v-for="swap in pendingSwaps" :key="swap.id" class="swap-item">
        <span>{{ swap.fromSchedule.nurse.name }} ↔ {{ swap.toSchedule.nurse.name }}</span>
        <div>
          <button @click="approveSwap(swap.id)" class="btn-approve">批准</button>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h3>添加排班</h3>
        <select v-model="newSchedule.nurseId">
          <option value="">选择护士</option>
          <option v-for="nurse in nurses" :key="nurse.id" :value="nurse.id">
            {{ nurse.name }} {{ nurse.isIcuQualified ? '(ICU)' : '' }}
          </option>
        </select>
        <input type="date" v-model="newSchedule.date" :min="todayStr" />
        <select v-model="newSchedule.shift">
          <option value="MORNING">早班</option>
          <option value="AFTERNOON">中班</option>
          <option value="NIGHT">晚班</option>
        </select>
        <div class="modal-actions">
          <button @click="showAddModal = false" class="btn-cancel">取消</button>
          <button @click="addSchedule" class="btn-confirm">确认</button>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="error-toast">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { scheduleApi, nurseApi } from '../api'
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns'

const schedules = ref([])
const nurses = ref([])
const pendingSwaps = ref([])
const currentDate = ref(new Date())
const showAddModal = ref(false)
const newSchedule = ref({ nurseId: '', date: '', shift: 'MORNING' })
const draggingId = ref(null)
const dragOverTarget = ref({ date: '', shift: '' })
const isDragging = ref(false)
const errorMessage = ref('')
const icuValidation = ref({ valid: true, icuNursesOnDuty: 0, requiredNurses: 0 })

const shifts = [
  { key: 'MORNING', name: '早班 08:00-16:00' },
  { key: 'AFTERNOON', name: '中班 16:00-00:00' },
  { key: 'NIGHT', name: '晚班 00:00-08:00' }
]

const today = new Date()
const todayStr = format(today, 'yyyy-MM-dd')

const weekStart = computed(() => format(startOfWeek(currentDate.value, { weekStartsOn: 1 }), 'MM/dd'))
const weekEnd = computed(() => format(endOfWeek(currentDate.value, { weekStartsOn: 1 }), 'MM/dd'))

const canGoPrevWeek = computed(() => {
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 })
  const startOfTargetWeek = startOfWeek(currentDate.value, { weekStartsOn: 1 })
  return startOfTargetWeek <= startOfCurrentWeek
})

const weekDays = computed(() => {
  const start = startOfWeek(currentDate.value, { weekStartsOn: 1 })
  const days = []
  const todayDate = format(today, 'yyyy-MM-dd')
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i)
    const dateStr = format(day, 'yyyy-MM-dd')
    days.push({
      key: dateStr,
      date: dateStr,
      weekday: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
      isPast: dateStr < todayDate,
      isToday: dateStr === todayDate
    })
  }
  return days
})

onMounted(async () => {
  newSchedule.value.date = todayStr
  await loadData()
})

watch(currentDate, () => {
  loadData()
})

const loadData = async () => {
  const start = format(startOfWeek(currentDate.value, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const end = format(endOfWeek(currentDate.value, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  
  const [schedulesRes, nursesRes, swapsRes, validationRes] = await Promise.all([
    scheduleApi.getByDateRange(start, end),
    nurseApi.getAll(),
    scheduleApi.getPendingSwaps(),
    scheduleApi.validateIcuCoverage(format(new Date(), 'yyyy-MM-dd'))
  ])
  
  schedules.value = schedulesRes.data
  nurses.value = nursesRes.data
  pendingSwaps.value = swapsRes.data
  icuValidation.value = validationRes.data
}

const scheduleMap = computed(() => {
  const map = {}
  schedules.value.forEach(s => {
    const key = `${s.scheduleDate}-${s.shift}`
    if (!map[key]) {
      map[key] = []
    }
    map[key].push(s)
  })
  return map
})

const getSchedules = (date, shift) => {
  const key = `${date}-${shift}`
  return scheduleMap.value[key] || []
}

const prevWeek = () => {
  currentDate.value = addDays(currentDate.value, -7)
}

const nextWeek = () => {
  currentDate.value = addDays(currentDate.value, 7)
}

const addSchedule = async () => {
  if (!newSchedule.value.nurseId || !newSchedule.value.date) return
  
  try {
    await scheduleApi.create({
      nurse: { id: newSchedule.value.nurseId },
      scheduleDate: newSchedule.value.date,
      shift: newSchedule.value.shift
    })
    showAddModal.value = false
    loadData()
  } catch (e) {
    errorMessage.value = e.response?.data?.error || '添加失败'
    setTimeout(() => errorMessage.value = '', 3000)
  }
}

let dragOverTimeout = null

const handleDragStart = (e, id) => {
  draggingId.value = id
  isDragging.value = true
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', id.toString())
}

const handleDragEnd = () => {
  draggingId.value = null
  isDragging.value = false
  dragOverTarget.value = { date: '', shift: '' }
  if (dragOverTimeout) {
    clearTimeout(dragOverTimeout)
    dragOverTimeout = null
  }
}

const handleDragOver = (e, date, shift) => {
  e.preventDefault()
  if (dragOverTimeout) {
    clearTimeout(dragOverTimeout)
  }
  dragOverTimeout = setTimeout(() => {
    if (dragOverTarget.value.date !== date || dragOverTarget.value.shift !== shift) {
      dragOverTarget.value = { date, shift }
    }
  }, 16)
}

const handleDragLeave = () => {
  if (dragOverTimeout) {
    clearTimeout(dragOverTimeout)
  }
  dragOverTimeout = setTimeout(() => {
    dragOverTarget.value = { date: '', shift: '' }
  }, 50)
}

const handleDrop = async (e, date, shift) => {
  e.preventDefault()
  e.stopPropagation()
  
  if (dragOverTimeout) {
    clearTimeout(dragOverTimeout)
    dragOverTimeout = null
  }
  
  dragOverTarget.value = { date: '', shift: '' }
  
  if (!draggingId.value) return
  
  const fromSchedule = schedules.value.find(s => s.id === draggingId.value)
  if (!fromSchedule) return
  
  if (fromSchedule.scheduleDate === date && fromSchedule.shift === shift) {
    draggingId.value = null
    isDragging.value = false
    return
  }
  
  const targetSchedules = getSchedules(date, shift)
  
  try {
    if (targetSchedules.length > 0) {
      await scheduleApi.requestSwap({
        fromScheduleId: draggingId.value,
        toScheduleId: targetSchedules[0].id
      })
    } else {
      await scheduleApi.update(draggingId.value, {
        scheduleDate: date,
        shift: shift
      })
    }
    await loadData()
  } catch (error) {
    errorMessage.value = '操作失败，请重试'
    setTimeout(() => errorMessage.value = '', 3000)
  } finally {
    draggingId.value = null
    isDragging.value = false
  }
}

const approveSwap = async (id) => {
  await scheduleApi.approveSwap(id, { approvedBy: '管理员' })
  loadData()
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h2 {
  color: #333;
  margin: 0;
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.date-nav button {
  width: 30px;
  height: 30px;
  border: none;
  background: #667eea;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.date-nav button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-add {
  padding: 0.6rem 1.2rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.icu-status {
  padding: 0.8rem;
  background: #d1fae5;
  color: #059669;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.icu-status.warning {
  background: #fef2f2;
  color: #dc2626;
}

.calendar {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.calendar-header {
  display: grid;
  grid-template-columns: 150px repeat(7, 1fr);
  background: #667eea;
  color: white;
}

.time-col {
  padding: 1rem;
}

.day-header {
  padding: 1rem;
  text-align: center;
  border-left: 1px solid rgba(255,255,255,0.2);
}

.day-name {
  font-size: 0.9rem;
  opacity: 0.9;
}

.day-date {
  font-size: 1.1rem;
  font-weight: bold;
}

.day-header.today-header {
  background: #059669 !important;
}

.calendar-body {
  display: grid;
  grid-template-columns: 150px repeat(7, 1fr);
}

.shift-row {
  display: contents;
}

.shift-label {
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.day-cell {
  min-height: 80px;
  padding: 0.5rem;
  border-left: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: background 0.2s;
}

.day-cell:hover {
  background: #f8fafc;
}

.day-cell.drag-over {
  background: #e0e7ff !important;
  border: 2px dashed #667eea !important;
  will-change: background, border;
}

.day-cell.past-date {
  background: #f3f4f6 !important;
  opacity: 0.6;
  cursor: not-allowed !important;
}

.day-cell.today {
  background: #ecfdf5 !important;
}

.day-cell.today .day-header {
  font-weight: bold;
  color: #059669;
}

.schedule-item {
  background: #667eea;
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
  cursor: grab;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.schedule-item.dragging {
  opacity: 0.4;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: grabbing;
}

.schedule-item:active {
  cursor: grabbing;
}

.schedule-item.past-schedule {
  opacity: 0.5;
  cursor: not-allowed !important;
}

.nurse-badge {
  background: #ef4444;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
}

.swap-requests {
  margin-top: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
}

.swap-requests h3 {
  margin-bottom: 1rem;
  color: #f59e0b;
}

.swap-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  background: #fef3c7;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.btn-approve {
  padding: 0.4rem 0.8rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
}

.modal h3 {
  margin-bottom: 1rem;
}

.modal select, .modal input {
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel {
  background: #e5e7eb;
}

.btn-confirm {
  background: #667eea;
  color: white;
}

.error-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #ef4444;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  z-index: 2000;
}
</style>
