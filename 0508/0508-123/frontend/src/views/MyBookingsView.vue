<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { bookingApi } from '@/api'
import type { Booking } from '@/types'
import dayjs from 'dayjs'

const bookings = ref<Booking[]>([])
const loading = ref(true)
const error = ref('')
const cancellingId = ref<number | null>(null)

const userId = computed(() => localStorage.getItem('astro_user_id') || '')

const loadBookings = async () => {
  if (!userId.value) {
    error.value = '请先设置用户信息'
    loading.value = false
    return
  }

  try {
    const response = await bookingApi.getByUser(userId.value)
    bookings.value = response.data
  } catch (err: any) {
    error.value = '加载预约列表失败: ' + (err.message || '未知错误')
  } finally {
    loading.value = false
  }
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    'PENDING': 'status-pending',
    'CONFIRMED': 'status-confirmed',
    'IN_PROGRESS': 'status-confirmed',
    'COMPLETED': 'status-completed',
    'CANCELLED': 'status-cancelled',
    'FAILED': 'status-cancelled'
  }
  return map[status] || 'status-pending'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'PENDING': '待确认',
    'CONFIRMED': '已确认',
    'IN_PROGRESS': '观测中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消',
    'FAILED': '失败'
  }
  return map[status] || status
}

const canCancel = (booking: Booking) => {
  return ['PENDING', 'CONFIRMED'].includes(booking.status) && 
         dayjs(booking.startTime).isAfter(dayjs())
}

const cancelBooking = async (booking: Booking) => {
  if (!confirm('确定要取消此预约吗？')) return

  cancellingId.value = booking.id

  try {
    await bookingApi.cancel(booking.id, userId.value)
    await loadBookings()
  } catch (err: any) {
    alert('取消预约失败: ' + (err.response?.data?.message || err.message || '未知错误'))
  } finally {
    cancellingId.value = null
  }
}

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadBookings()
})
</script>

<template>
  <div class="my-bookings">
    <h1>📋 我的预约</h1>
    <p style="margin-bottom: 20px;">查看和管理您的望远镜预约记录</p>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <div v-else-if="bookings.length === 0" class="card">
      <p style="text-align: center;">暂无预约记录</p>
      <button 
        class="btn btn-primary" 
        style="display: block; margin: 20px auto 0;"
        @click="$router.push('/telescopes')"
      >
        去预约望远镜
      </button>
    </div>

    <div v-else class="bookings-list">
      <div 
        v-for="booking in bookings" 
        :key="booking.id" 
        class="card booking-card"
      >
        <div class="booking-header">
          <div>
            <h3>{{ booking.targetName }}</h3>
            <p style="margin: 4px 0 0;">{{ booking.telescope?.name || '未知设备' }}</p>
          </div>
          <span class="status-badge" :class="getStatusClass(booking.status)">
            {{ getStatusText(booking.status) }}
          </span>
        </div>

        <div class="grid grid-2" style="margin-top: 16px;">
          <div class="spec-item">
            <span class="spec-label">观测时间</span>
            <span class="spec-value">
              {{ formatDateTime(booking.startTime) }} - {{ formatDateTime(booking.endTime) }}
            </span>
          </div>
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
        </div>

        <div class="booking-actions" v-if="canCancel(booking) || booking.status === 'COMPLETED'">
          <button 
            v-if="canCancel(booking)"
            class="btn btn-danger"
            :disabled="cancellingId === booking.id"
            @click="cancelBooking(booking)"
          >
            {{ cancellingId === booking.id ? '取消中...' : '取消预约' }}
          </button>

          <button 
            v-if="booking.status === 'COMPLETED'"
            class="btn btn-success"
            @click="$router.push('/images')"
          >
            查看观测图像
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.booking-card {
  transition: transform 0.3s ease;
}

.booking-card:hover {
  transform: translateX(4px);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.booking-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
