<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { telescopeApi, bookingApi } from '@/api'
import type { Telescope, SlotInfo, BookingRequest, GuideStarCatalog, GuideStarResponse } from '@/types'
import dayjs from 'dayjs'
import GuideStarSimulator from '@/components/GuideStarSimulator.vue'

const route = useRoute()
const router = useRouter()

const telescope = ref<Telescope | null>(null)
const slots = ref<SlotInfo[]>([])
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const success = ref('')

const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const selectedSlots = ref<string[]>([])

const form = ref({
  ra: 12.0,
  dec: 30.0,
  exposureTime: 60,
  targetName: ''
})

const selectedGuideStar = ref<GuideStarCatalog | null>(null)
const guideStarSimulationResult = ref<GuideStarResponse | null>(null)

const observationTimeForGuiding = computed(() => {
  if (!selectedStartEnd.value) {
    return dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm:ss')
  }
  return dayjs(selectedStartEnd.value.start).format('YYYY-MM-DDTHH:mm:ss')
})

const handleGuideStarSelected = (star: GuideStarCatalog) => {
  selectedGuideStar.value = star
}

const handleSimulationComplete = (result: GuideStarResponse) => {
  guideStarSimulationResult.value = result
}

const userId = computed(() => localStorage.getItem('astro_user_id') || '')
const userName = computed(() => localStorage.getItem('astro_user_name') || '')

const availableDates = computed(() => {
  const dates = []
  for (let i = 0; i < 7; i++) {
    dates.push(dayjs().add(i, 'day').format('YYYY-MM-DD'))
  }
  return dates
})

const selectedStartEnd = computed(() => {
  if (selectedSlots.value.length === 0) return null
  
  const sorted = [...selectedSlots.value].sort()
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  
  return {
    start: first,
    end: dayjs(last).add(30, 'minute').format('YYYY-MM-DD HH:mm')
  }
})

watch(selectedDate, () => {
  loadSlots()
  selectedSlots.value = []
})

const loadTelescope = async () => {
  try {
    const id = Number(route.params.telescopeId)
    const response = await telescopeApi.getById(id)
    telescope.value = response.data
  } catch (err: any) {
    error.value = '加载望远镜信息失败: ' + (err.message || '未知错误')
  }
}

const loadSlots = async () => {
  try {
    const id = Number(route.params.telescopeId)
    const response = await bookingApi.getSlots(id, selectedDate.value)
    slots.value = response.data
  } catch (err: any) {
    error.value = '加载时间槽失败: ' + (err.message || '未知错误')
  } finally {
    loading.value = false
  }
}

const toggleSlot = (slot: SlotInfo) => {
  if (!slot.available) return
  
  const timeKey = dayjs(slot.startTime).format('YYYY-MM-DD HH:mm')
  const index = selectedSlots.value.indexOf(timeKey)
  
  if (index > -1) {
    selectedSlots.value.splice(index, 1)
  } else {
    selectedSlots.value.push(timeKey)
    selectedSlots.value.sort()
  }
}

const isSlotSelected = (slot: SlotInfo) => {
  const timeKey = dayjs(slot.startTime).format('YYYY-MM-DD HH:mm')
  return selectedSlots.value.includes(timeKey)
}

const formatTime = (timeStr: string) => {
  return dayjs(timeStr).format('HH:mm')
}

const validateForm = () => {
  if (!userId.value || !userName.value) {
    error.value = '请先设置用户信息'
    return false
  }
  
  if (selectedSlots.value.length === 0) {
    error.value = '请至少选择一个时间槽'
    return false
  }
  
  if (!form.value.targetName.trim()) {
    error.value = '请输入目标名称'
    return false
  }
  
  if (form.value.ra < 0 || form.value.ra > 24) {
    error.value = '赤经应在 0-24 小时之间'
    return false
  }
  
  if (form.value.dec < -90 || form.value.dec > 90) {
    error.value = '赤纬应在 -90 到 90 度之间'
    return false
  }
  
  if (form.value.exposureTime < 1 || form.value.exposureTime > 3600) {
    error.value = '曝光时间应在 1-3600 秒之间'
    return false
  }
  
  return true
}

const submitBooking = async () => {
  error.value = ''
  success.value = ''
  
  if (!validateForm()) return
  
  if (!selectedStartEnd.value) return
  
  submitting.value = true
  
  try {
    const request: BookingRequest = {
      telescopeId: Number(route.params.telescopeId),
      userId: userId.value,
      userName: userName.value,
      startTime: selectedStartEnd.value.start,
      endTime: selectedStartEnd.value.end,
      ra: form.value.ra,
      dec: form.value.dec,
      exposureTime: form.value.exposureTime,
      targetName: form.value.targetName.trim()
    }
    
    const response = await bookingApi.create(request)
    
    if (response.data.success) {
      success.value = `预约成功！预约ID: ${response.data.bookingId}，目标仰角: ${response.data.elevation.toFixed(2)}°`
      selectedSlots.value = []
      await loadSlots()
      
      setTimeout(() => {
        router.push('/my-bookings')
      }, 2000)
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '预约失败: ' + (err.message || '未知错误')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadTelescope()
  await loadSlots()
})
</script>

<template>
  <div class="booking">
    <button class="btn btn-primary" style="margin-bottom: 20px;" @click="router.back()">
      ← 返回设备列表
    </button>

    <div v-if="telescope" class="card">
      <h2>📅 预约: {{ telescope.name }}</h2>
      <div class="grid grid-2" style="margin-bottom: 20px;">
        <div class="spec-item">
          <span class="spec-label">主镜</span>
          <span class="spec-value">{{ telescope.primaryMirror }}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">相机</span>
          <span class="spec-value">{{ telescope.cameraModel }}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">视场</span>
          <span class="spec-value">{{ telescope.fieldOfView }}°</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">极限星等</span>
          <span class="spec-value">{{ telescope.limitingMagnitude }} mag</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">最小仰角</span>
          <span class="spec-value">{{ telescope.minElevation }}°</span>
        </div>
      </div>
    </div>

    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div class="card">
      <h3>1. 选择预约日期</h3>
      <div class="date-selector">
        <button 
          v-for="date in availableDates" 
          :key="date"
          class="date-btn"
          :class="{ active: selectedDate === date }"
          @click="selectedDate = date"
        >
          <div class="date-day">{{ dayjs(date).format('DD') }}</div>
          <div class="date-weekday">{{ dayjs(date).format('ddd') }}</div>
          <div class="date-month">{{ dayjs(date).format('MM月') }}</div>
        </button>
      </div>
    </div>

    <div class="card">
      <h3>2. 选择时间槽 (19:00-23:00，每30分钟一格)</h3>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-else class="slots-grid">
        <div 
          v-for="slot in slots" 
          :key="slot.startTime"
          class="slot"
          :class="{
            'slot-available': slot.available,
            'slot-occupied': !slot.available,
            'slot-selected': isSlotSelected(slot)
          }"
          @click="toggleSlot(slot)"
        >
          <div class="slot-time">{{ formatTime(slot.startTime) }}</div>
          <div v-if="!slot.available" class="slot-booked">
            {{ slot.bookedBy }}
          </div>
          <div v-else-if="isSlotSelected(slot)" class="slot-booked">
            已选择
          </div>
        </div>
      </div>

      <div v-if="selectedSlots.length > 0" style="margin-top: 16px;" class="alert alert-info">
        已选择 {{ selectedSlots.length }} 个时间槽，时间: {{ selectedStartEnd?.start }} - {{ selectedStartEnd?.end }}
      </div>
    </div>

    <div class="card">
      <h3>3. 输入观测目标信息</h3>
      
      <div class="grid grid-2">
        <div class="form-group">
          <label class="form-label">目标名称</label>
          <input 
            v-model="form.targetName" 
            type="text" 
            class="form-input" 
            placeholder="例如: M42 猎户座大星云"
          />
        </div>

        <div class="form-group">
          <label class="form-label">赤经 (RA, 0-24小时)</label>
          <input 
            v-model.number="form.ra" 
            type="number" 
            step="0.01"
            min="0" 
            max="24"
            class="form-input" 
            placeholder="例如: 12.5"
          />
        </div>

        <div class="form-group">
          <label class="form-label">赤纬 (Dec, -90 到 90度)</label>
          <input 
            v-model.number="form.dec" 
            type="number" 
            step="0.01"
            min="-90" 
            max="90"
            class="form-input" 
            placeholder="例如: 30.5"
          />
        </div>

        <div class="form-group">
          <label class="form-label">曝光时间 (秒)</label>
          <input 
            v-model.number="form.exposureTime" 
            type="number" 
            min="1" 
            max="3600"
            class="form-input" 
            placeholder="例如: 60"
          />
        </div>
      </div>

      <div class="alert alert-info">
        💡 系统会自动计算目标的地平仰角。该望远镜最小仰角要求为 {{ telescope?.minElevation || 15 }}°，只有仰角高于此限制的目标才允许预约。
      </div>
    </div>

    <div class="card">
      <GuideStarSimulator
        v-if="telescope"
        :telescope-id="telescope.id"
        :target-ra="form.ra"
        :target-dec="form.dec"
        :target-name="form.targetName"
        :observation-time="observationTimeForGuiding"
        :exposure-time="form.exposureTime"
        @guide-star-selected="handleGuideStarSelected"
        @simulation-complete="handleSimulationComplete"
      />
    </div>

    <div class="card">
      <button 
        class="btn btn-primary" 
        style="width: 100%; padding: 16px; font-size: 16px;"
        :disabled="submitting || selectedSlots.length === 0"
        @click="submitBooking"
      >
        <span v-if="submitting">提交中...</span>
        <span v-else>确认预约</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.date-selector {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.date-btn {
  flex: 0 0 auto;
  width: 80px;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
}

.date-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.date-btn.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
}

.date-day {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.date-weekday {
  font-size: 12px;
  color: #b0b0b0;
  margin-top: 4px;
}

.date-month {
  font-size: 12px;
  color: #808080;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 600px) {
  .slots-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.slot-time {
  font-weight: 600;
  font-size: 14px;
}

.slot-booked {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.8;
}
</style>
