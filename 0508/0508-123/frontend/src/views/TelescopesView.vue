<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { telescopeApi } from '@/api'
import type { Telescope } from '@/types'

const router = useRouter()
const telescopes = ref<Telescope[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const response = await telescopeApi.getAll()
    telescopes.value = response.data
  } catch (err: any) {
    error.value = '加载设备列表失败: ' + (err.message || '未知错误')
  } finally {
    loading.value = false
  }
})

const goToBooking = (telescopeId: number) => {
  router.push(`/booking/${telescopeId}`)
}

const getStatusClass = (status: string) => {
  return status === 'AVAILABLE' ? 'status-confirmed' : 'status-cancelled'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'AVAILABLE': '可用',
    'MAINTENANCE': '维护中',
    'OFFLINE': '离线'
  }
  return map[status] || status
}
</script>

<template>
  <div class="telescopes">
    <h1>🔭 望远镜设备列表</h1>
    <p style="margin-bottom: 20px;">查看所有可用的天文望远镜设备，选择合适的设备进行预约</p>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <div v-else class="grid grid-2">
      <div 
        v-for="telescope in telescopes" 
        :key="telescope.id" 
        class="card telescope-card"
      >
        <h3>{{ telescope.name }}</h3>
        <p v-if="telescope.description" style="margin-bottom: 16px;">
          {{ telescope.description }}
        </p>
        
        <div class="specs">
          <div class="spec-item">
            <span class="spec-label">主镜参数</span>
            <span class="spec-value">{{ telescope.primaryMirror }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">相机型号</span>
            <span class="spec-value">{{ telescope.cameraModel }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">视场角</span>
            <span class="spec-value">{{ telescope.fieldOfView }}°</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">极限星等</span>
            <span class="spec-value">{{ telescope.limitingMagnitude }} 星等</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">最小仰角</span>
            <span class="spec-value">{{ telescope.minElevation }}°</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">设备状态</span>
            <span class="status-badge" :class="getStatusClass(telescope.status)">
              {{ getStatusText(telescope.status) }}
            </span>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <button 
            class="btn btn-primary" 
            style="width: 100%;"
            :disabled="telescope.status !== 'AVAILABLE'"
            @click="goToBooking(telescope.id)"
          >
            {{ telescope.status === 'AVAILABLE' ? '预约此设备' : '设备不可预约' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="telescopes.length === 0 && !loading && !error" class="card">
      <p style="text-align: center;">暂无可用的望远镜设备</p>
    </div>
  </div>
</template>

<style scoped>
.specs {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 12px;
}
</style>
