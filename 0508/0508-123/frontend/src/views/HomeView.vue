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
</script>

<template>
  <div class="home">
    <div class="hero card">
      <h1>🔭 欢迎使用天文望远镜预约系统</h1>
      <p>远程预约学校的专业天文望远镜，探索宇宙的奥秘。系统会自动进行地平目标仰角计算，并为您生成平场校准后的观测图像。</p>
    </div>

    <h2>可选望远镜设备</h2>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <div v-else class="grid grid-3">
      <div 
        v-for="telescope in telescopes" 
        :key="telescope.id" 
        class="card telescope-card"
      >
        <h3>{{ telescope.name }}</h3>
        <div class="specs">
          <div class="spec-item">
            <span class="spec-label">主镜</span>
            <span class="spec-value">{{ telescope.primaryMirror }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">相机型号</span>
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
          <div class="spec-item">
            <span class="spec-label">状态</span>
            <span 
              class="status-badge" 
              :class="telescope.status === 'AVAILABLE' ? 'status-confirmed' : 'status-cancelled'"
            >
              {{ telescope.status === 'AVAILABLE' ? '可用' : '不可用' }}
            </span>
          </div>
        </div>
        <button 
          class="btn btn-primary" 
          style="width: 100%; margin-top: 16px;"
          :disabled="telescope.status !== 'AVAILABLE'"
          @click="goToBooking(telescope.id)"
        >
          {{ telescope.status === 'AVAILABLE' ? '立即预约' : '设备不可用' }}
        </button>
      </div>
    </div>

    <div class="card" style="margin-top: 20px;">
      <h3>📋 系统功能</h3>
      <div class="grid grid-2" style="margin-top: 16px;">
        <div>
          <h4>🔭 远程观测预约</h4>
          <p>每晚 19:00-23:00，每30分钟一个时间槽，灵活预约专业望远镜</p>
        </div>
        <div>
          <h4>📍 智能仰角计算</h4>
          <p>自动计算天体的地平仰角，确保目标在地平线以上</p>
        </div>
        <div>
          <h4>✨ 平场校准生成</h4>
          <p>根据黄昏天空亮度自动生成伪 FITS 平场校准文件</p>
        </div>
        <div>
          <h4>📥 一键下载图像</h4>
          <p>获取原始图像 + 平场校正后的专业观测数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: 40px;
}

.hero h1 {
  font-size: 32px;
  margin-bottom: 16px;
}

.specs {
  margin-top: 16px;
}
</style>
