<template>
  <div class="app-container">
    <header>
      <h1>🏊 游泳馆泳道速度匹配器</h1>
      <p>输入您的游泳速度，系统将为您推荐最适合的泳道</p>
    </header>

    <div class="card">
      <h2>📝 输入您的速度</h2>
      <div class="input-group">
        <input
          type="number"
          v-model.number="speed"
          placeholder="请输入您的 50 米用时（分钟）"
          step="0.1"
          min="0.1"
          @keyup.enter="getRecommendation"
        />
        <button class="btn btn-primary" @click="getRecommendation" :disabled="loading || !speed">
          <span v-if="loading" class="loading">
            <span class="spinner"></span>
            推荐中...
          </span>
          <span v-else>🎯 获取推荐</span>
        </button>
      </div>

      <div class="tips">
        <h4>💡 速度参考</h4>
        <ul>
          <li><strong>快速</strong>：小于 1 分钟 / 50 米（职业/精英水平）</li>
          <li><strong>中速</strong>：1 - 1.5 分钟 / 50 米（熟练水平）</li>
          <li><strong>慢速</strong>：大于 1.5 分钟 / 50 米（入门/休闲水平）</li>
        </ul>
      </div>
    </div>

    <div class="card">
      <h2>
        🚦 实时拥挤状态
        <span class="refresh-timer">
          <span class="spinner small"></span>
          每 5 秒刷新
        </span>
      </h2>
      <div class="lanes-grid crowd-grid">
        <div
          v-for="lane in realtimeLaneStatus"
          :key="lane.laneId"
          class="lane-card crowd-card"
          :class="[
            'crowd-' + lane.crowdLevelClass,
            { 'crowd-empty': lane.crowdLevelClass === 'empty' }
          ]"
        >
          <div class="lane-number">{{ lane.laneId }}</div>
          <div class="lane-name">{{ lane.name }}</div>
          <div class="crowd-indicator">
            <span class="crowd-badge" :class="'badge-' + lane.crowdLevelClass">
              {{ lane.crowdLevel }}
            </span>
          </div>
          <div class="crowd-bar-container">
            <div 
              class="crowd-bar" 
              :class="'bar-' + lane.crowdLevelClass"
              :style="{ width: lane.loadFactor }"
            ></div>
          </div>
          <div class="lane-stats crowd-stats">
            <span class="stat-icon">👥</span>
            <span class="stat-value">{{ lane.currentLoad }}/{{ lane.maxOccupancy }} 人</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="recommendation" class="card">
      <h2>🎯 推荐结果</h2>
      
      <div class="recommendation-result">
        <h3>{{ recommendation.message }}</h3>
        <p>您的速度：<strong>{{ recommendation.userSpeed }} 分钟/50米</strong></p>
        <span class="speed-badge" :class="getSpeedCategoryClass(recommendation.speedCategory)">
          {{ recommendation.speedCategory }}
        </span>
      </div>

      <div class="lanes-grid">
        <div
          v-for="lane in recommendation.allLanes"
          :key="lane.id"
          class="lane-card"
          :class="{
            recommended: lane.isRecommended,
            selected: selectedLaneId === lane.id,
            'crowd-' + lane.crowdLevelClass: true
          }"
          @click="selectLane(lane.id)"
        >
          <div class="lane-number">{{ lane.id }}</div>
          <div class="lane-name">{{ lane.name }}</div>
          <div class="lane-speed-range">
            {{ formatSpeedRange(lane.minSpeed, lane.maxSpeed) }}
          </div>
          <div class="crowd-mini">
            <span class="crowd-badge mini" :class="'badge-' + lane.crowdLevelClass">
              {{ lane.crowdLevel }}
            </span>
          </div>
          <div class="lane-stats">
            <span>👥 {{ lane.currentLoad }}/{{ lane.maxOccupancy }}</span>
            <span>⭐ {{ lane.feedbackCount }}</span>
          </div>
          <div v-if="lane.isRecommended" style="margin-top: 10px; color: #667eea; font-weight: 600;">
            ✨ 推荐
          </div>
        </div>
      </div>

      <div class="feedback-section">
        <h3>📢 反馈您的实际选择</h3>
        <p style="color: #666; margin-bottom: 15px;">
          点击上方泳道卡片选择您实际使用的泳道，然后提交反馈帮助我们优化推荐。
        </p>
        <button
          class="btn btn-success"
          @click="submitFeedback"
          :disabled="!selectedLaneId || feedbackLoading"
        >
          <span v-if="feedbackLoading" class="loading">
            <span class="spinner"></span>
            提交中...
          </span>
          <span v-else>📨 提交反馈</span>
        </button>

        <div v-if="feedbackMessage" class="feedback-message">
          ✅ {{ feedbackMessage }}
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📊 泳道配置与动态权重</h2>
      <div class="lanes-grid">
        <div
          v-for="laneWeight in laneWeights"
          :key="laneWeight.laneId"
          class="lane-card"
          style="cursor: default;"
        >
          <div class="lane-number">{{ laneWeight.laneId }}</div>
          <div class="lane-name">{{ getLaneName(laneWeight.laneId) }}</div>
          <div class="lane-speed-range" style="margin-bottom: 5px;">
            <span class="speed-badge" :class="getSpeedCategoryClass(laneWeight.speedCategory)">
              {{ laneWeight.speedCategory }}
            </span>
          </div>
          <div class="weight-info">
            <div class="weight-item">
              <span class="weight-label">权重</span>
              <span class="weight-value">{{ laneWeight.totalWeight }}</span>
            </div>
            <div class="weight-item">
              <span class="weight-label">推荐</span>
              <span class="weight-value">{{ laneWeight.recommendationCount }}</span>
            </div>
            <div class="weight-item">
              <span class="weight-label">选择</span>
              <span class="weight-value">{{ laneWeight.actualSelectionCount }}</span>
            </div>
            <div class="weight-item">
              <span class="weight-label">匹配率</span>
              <span class="weight-value" :class="{ 'match-high': parseFloat(laneWeight.matchRate) >= 70, 'match-low': parseFloat(laneWeight.matchRate) < 70 }">
                {{ laneWeight.matchRate }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📈 系统分析统计</h2>
      <div v-if="analytics" class="analytics-summary">
        <div class="stat-card">
          <div class="stat-value">{{ analytics.totalRecommendations }}</div>
          <div class="stat-label">总推荐次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ analytics.totalFeedback }}</div>
          <div class="stat-label">总反馈次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ feedbackRate }}%</div>
          <div class="stat-label">反馈率</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📜 最近历史记录</h2>
      <div v-if="history.length > 0">
        <table class="history-table">
          <thead>
            <tr>
              <th>速度</th>
              <th>推荐泳道</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in history" :key="item.id">
              <td>{{ item.speed }} 分钟/50米</td>
              <td>泳道 {{ item.recommendedLaneId || '-' }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <span style="font-size: 3rem;">📭</span>
        <p>暂无历史记录</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import axios from 'axios'

const speed = ref('')
const loading = ref(false)
const feedbackLoading = ref(false)
const recommendation = ref(null)
const selectedLaneId = ref(null)
const feedbackMessage = ref('')
const lanes = ref([])
const history = ref([])
const laneWeights = ref([])
const analytics = ref(null)
const realtimeLaneStatus = ref([])

let refreshInterval = null

const feedbackRate = computed(() => {
  if (!analytics.value) return 0
  if (analytics.value.totalRecommendations === 0) return 0
  return ((analytics.value.totalFeedback / analytics.value.totalRecommendations) * 100).toFixed(1)
})

onMounted(() => {
  fetchLanes()
  fetchHistory()
  fetchAnalytics()
  fetchLaneStatus()
  
  refreshInterval = setInterval(() => {
    fetchLaneStatus()
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

const fetchLaneStatus = async () => {
  try {
    const response = await axios.get('/api/lane-status')
    if (response.data.success) {
      realtimeLaneStatus.value = response.data.data.lanes
    }
  } catch (error) {
    console.error('Failed to fetch lane status:', error)
  }
}

const fetchLanes = async () => {
  try {
    const response = await axios.get('/api/lanes')
    if (response.data.success) {
      lanes.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch lanes:', error)
  }
}

const fetchHistory = async () => {
  try {
    const response = await axios.get('/api/history')
    if (response.data.success) {
      history.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch history:', error)
  }
}

const fetchAnalytics = async () => {
  try {
    const [analyticsRes, weightsRes] = await Promise.all([
      axios.get('/api/analytics'),
      axios.get('/api/lane-weights')
    ])
    
    if (analyticsRes.data.success) {
      analytics.value = analyticsRes.data.data
      laneWeights.value = analyticsRes.data.data.laneWeights
    }
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  }
}

const getLaneName = (laneId) => {
  const lane = lanes.value.find(l => l.id === laneId)
  return lane ? lane.name : `泳道${laneId}`
}

const getRecommendation = async () => {
  if (!speed.value) return
  
  loading.value = true
  feedbackMessage.value = ''
  selectedLaneId.value = null

  try {
    const response = await axios.post('/api/recommend', {
      speed: speed.value
    })
    recommendation.value = response.data
    fetchHistory()
    fetchLaneStatus()
  } catch (error) {
    console.error('Failed to get recommendation:', error)
    alert('获取推荐失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const selectLane = (laneId) => {
  selectedLaneId.value = laneId
}

const submitFeedback = async () => {
  if (!selectedLaneId.value || !recommendation.value) return

  feedbackLoading.value = true

  try {
    const response = await axios.post('/api/feedback', {
      historyId: recommendation.value.historyId,
      recommendedLaneId: recommendation.value.recommendedLaneId,
      actualLaneId: selectedLaneId.value,
      speed: recommendation.value.userSpeed
    })
    
    feedbackMessage.value = response.data.message
    
    fetchHistory()
    fetchAnalytics()
    fetchLaneStatus()
  } catch (error) {
    console.error('Failed to submit feedback:', error)
    alert('提交反馈失败，请稍后重试')
  } finally {
    feedbackLoading.value = false
  }
}

const getSpeedCategoryClass = (category) => {
  if (category === '快速') return 'fast'
  if (category === '中速') return 'medium'
  return 'slow'
}

const formatSpeedRange = (min, max) => {
  if (max >= 99) {
    return `${}+ 分钟/50米`.replace('{}', min)
  }
  return `${min} - ${max} 分钟/50米`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>