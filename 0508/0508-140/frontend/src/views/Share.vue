<template>
  <div class="share-container">
    <header class="app-header">
      <h1>🏺 陶瓷拉坯模拟器 - 分享作品</h1>
      <router-link to="/" class="back-link">返回首页</router-link>
    </header>
    
    <main class="main-content" v-if="!loading">
      <div class="share-info" v-if="shareData">
        <div class="pottery-title">{{ shareData.pottery.name }}</div>
        <div class="pottery-type">
          <el-tag>{{ shareData.potteryType === 'classic' ? '经典器型' : '用户创作' }}</el-tag>
        </div>
      </div>
      
      <div class="viewer-wrapper">
        <ShareModelViewer :points="parsedPoints" />
      </div>
    </main>
    
    <div class="loading-container" v-else>
      <el-icon class="is-loading" :size="48"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div class="error-container" v-if="error">
      <el-icon :size="64" color="#f56c6c"><Warning /></el-icon>
      <h3>{{ error }}</h3>
      <router-link to="/" class="back-btn">返回首页</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loading, Warning } from '@element-plus/icons-vue'
import { getShareByCode } from '@/utils/api'
import ShareModelViewer from '@/components/ShareModelViewer.vue'

const route = useRoute()
const shareData = ref(null)
const loading = ref(true)
const error = ref('')

const parsedPoints = computed(() => {
  if (!shareData.value || !shareData.value.pottery) {
    return []
  }
  
  try {
    return JSON.parse(shareData.value.pottery.profilePoints)
  } catch (e) {
    console.error('解析轮廓数据失败:', e)
    return []
  }
})

onMounted(async () => {
  const shareCode = route.params.shareCode
  
  if (!shareCode) {
    error.value = '无效的分享链接'
    loading.value = false
    return
  }
  
  try {
    shareData.value = await getShareByCode(shareCode)
  } catch (e) {
    console.error('加载分享数据失败:', e)
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.share-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.app-header {
  padding: 20px 30px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 20px;
  color: #333;
  font-weight: bold;
}

.back-link {
  color: #409EFF;
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  text-decoration: underline;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  min-height: 0;
}

.share-info {
  text-align: center;
  margin-bottom: 20px;
}

.pottery-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.viewer-wrapper {
  flex: 1;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading-container, .error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.error-container h3 {
  margin: 0;
  color: #f56c6c;
}

.back-btn {
  padding: 10px 24px;
  background: #409EFF;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
}

.back-btn:hover {
  background: #66b1ff;
}
</style>
