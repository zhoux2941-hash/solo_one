<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { bookingApi, imageApi } from '@/api'
import type { Booking, ImageStatus } from '@/types'
import dayjs from 'dayjs'

const bookings = ref<Booking[]>([])
const imageStatuses = ref<Record<number, ImageStatus>>({})
const loading = ref(true)
const error = ref('')
const downloadingId = ref<number | null>(null)

const userId = computed(() => localStorage.getItem('astro_user_id') || '')

const completedBookings = computed(() => {
  return bookings.value.filter(b => 
    ['COMPLETED', 'IN_PROGRESS', 'CONFIRMED'].includes(b.status)
  )
})

const loadBookings = async () => {
  if (!userId.value) {
    error.value = '请先设置用户信息'
    loading.value = false
    return
  }

  try {
    const response = await bookingApi.getByUser(userId.value)
    bookings.value = response.data

    for (const booking of bookings.value) {
      if (booking.status === 'COMPLETED') {
        loadImageStatus(booking.id)
      }
    }
  } catch (err: any) {
    error.value = '加载预约列表失败: ' + (err.message || '未知错误')
  } finally {
    loading.value = false
  }
}

const loadImageStatus = async (bookingId: number) => {
  try {
    const response = await imageApi.getStatus(bookingId)
    imageStatuses.value[bookingId] = response.data
  } catch (err: any) {
    console.error('Failed to load image status for booking', bookingId, err)
  }
}

const downloadImage = async (booking: Booking) => {
  downloadingId.value = booking.id

  try {
    const response = await imageApi.downloadCalibrated(booking.id)
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `calibrated_${booking.targetName}_${booking.id}.json`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    alert('下载失败: ' + (err.message || '未知错误'))
  } finally {
    downloadingId.value = null
  }
}

const getImageStatus = (bookingId: number): ImageStatus => {
  return imageStatuses.value[bookingId] || { ready: false, message: '检查中...' }
}

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadBookings()
})
</script>

<template>
  <div class="images">
    <h1>📸 观测图像</h1>
    <p style="margin-bottom: 20px;">下载您已完成观测的校准图像（原始图 + 平场校正）</p>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <div v-else-if="completedBookings.length === 0" class="card">
      <p style="text-align: center;">暂无已完成的观测记录</p>
      <div class="alert alert-info" style="margin-top: 16px;">
        💡 观测完成后，系统会自动生成平场校准文件。图像生成可能需要几分钟时间。
      </div>
    </div>

    <div v-else class="images-list">
      <div 
        v-for="booking in completedBookings" 
        :key="booking.id" 
        class="card image-card"
      >
        <div class="image-header">
          <div>
            <h3>{{ booking.targetName }}</h3>
            <p style="margin: 4px 0 0;">
              {{ booking.telescope?.name || '未知设备' }} · 
              {{ formatDateTime(booking.startTime) }}
            </p>
          </div>
          <span 
            class="status-badge" 
            :class="booking.status === 'COMPLETED' ? 'status-completed' : 'status-confirmed'"
          >
            {{ booking.status === 'COMPLETED' ? '已完成' : '观测中' }}
          </span>
        </div>

        <div class="grid grid-2" style="margin-top: 16px;">
          <div class="spec-item">
            <span class="spec-label">赤经 / 赤纬</span>
            <span class="spec-value">RA: {{ booking.ra }}h / Dec: {{ booking.dec }}°</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">曝光时间</span>
            <span class="spec-value">{{ booking.exposureTime }} 秒</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">仰角</span>
            <span class="spec-value">{{ booking.elevation?.toFixed(2) || '--' }}°</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">预约ID</span>
            <span class="spec-value">#{{ booking.id }}</span>
          </div>
        </div>

        <div v-if="booking.status === 'COMPLETED'" class="image-actions">
          <div class="image-status" v-if="getImageStatus(booking.id).ready">
            <span class="status-badge status-completed">✓ 图像已生成</span>
            <span class="brightness">
              天空亮度: {{ getImageStatus(booking.id).skyBrightness?.toFixed(0) }} ADU
            </span>
          </div>
          <div v-else class="image-status">
            <span class="status-badge status-pending">⏳ 图像处理中</span>
            <span class="brightness-text">
              {{ getImageStatus(booking.id).message || '请稍候...' }}
            </span>
          </div>

          <button 
            class="btn btn-success"
            :disabled="!getImageStatus(booking.id).ready || downloadingId === booking.id"
            @click="downloadImage(booking)"
          >
            <span v-if="downloadingId === booking.id">下载中...</span>
            <span v-else>📥 下载校准图像</span>
          </button>
        </div>

        <div v-else class="alert alert-info" style="margin-top: 16px;">
          ⏳ 观测尚未完成，请等待观测结束后图像自动生成
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 20px;">
      <h3>ℹ️ 关于平场校准</h3>
      <p style="margin-top: 8px;">
        平场校准（Flat Field Calibration）是天文图像处理中的重要步骤。系统会根据该晚黄昏时刻的平均天空亮度，
        生成伪 FITS 格式的平场图像，用于校正探测器的像素不均匀性和光学系统的渐晕效应。
      </p>
      <p style="margin-top: 8px;">
        下载的文件包含：原始图像数据 + 平场校准后的数据，以 JSON 格式存储（包含 FITS 头信息和像素数据）。
      </p>
    </div>
  </div>
</template>

<style scoped>
.images-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-card {
  transition: transform 0.3s ease;
}

.image-card:hover {
  transform: translateX(4px);
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.image-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  flex-wrap: wrap;
  gap: 12px;
}

.image-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brightness {
  font-size: 13px;
  color: #b0b0b0;
  margin-top: 4px;
}

.brightness-text {
  font-size: 13px;
  color: #b0b0b0;
  margin-top: 4px;
}
</style>
