<template>
  <div class="consensus">
    <div class="card">
      <h1>🌟 公认辐射点统计</h1>
      <p class="subtitle">综合所有观测者的结果，取众数作为该次观测的公认辐射点</p>

      <div class="selector">
        <label class="form-label">选择流星雨</label>
        <select v-model="selectedShower" class="form-select" @change="loadData">
          <option value="">请选择流星雨</option>
          <option v-for="s in showers" :key="s.name" :value="s.name">
            {{ s.chineseName || s.name }} ({{ s.name }})
          </option>
        </select>
      </div>
    </div>

    <div v-if="consensusResult" class="grid grid-2">
      <div class="card consensus-card">
        <h2>📊 统计结果</h2>

        <div class="stat-row">
          <span class="stat-label">总观测会话</span>
          <span class="stat-value">{{ consensusResult.totalSessions }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">有效辐射点计算</span>
          <span class="stat-value">{{ consensusResult.sessionsWithRadiant }}</span>
        </div>

        <div v-if="consensusResult.consensusConstellation" class="result-highlight">
          <div class="result-title">🏆 公认辐射点</div>
          <div class="result-constellation">{{ consensusResult.consensusConstellation }}</div>
          <div class="result-coords" v-if="consensusResult.consensusRA != null">
            RA: {{ consensusResult.consensusRA?.toFixed(2) }}° | Dec: {{ consensusResult.consensusDec?.toFixed(2) }}°
          </div>
          <div class="result-confidence">
            置信度：{{ (consensusResult.confidence * 100).toFixed(1) }}%
          </div>
        </div>

        <div v-else class="no-result">
          <p>暂无足够数据计算公认辐射点</p>
          <p class="note">需要至少有一个观测会话完成辐射点计算</p>
        </div>
      </div>

      <div class="card">
        <h2>📈 星座分布</h2>
        <div v-if="hasCounts" class="bar-chart">
          <div v-for="(count, constellation) in sortedCounts" :key="constellation" class="bar-item">
            <div class="bar-label">{{ constellation }}</div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: getBarWidth(count) + '%' }"></div>
            </div>
            <div class="bar-count">{{ count }} 次</div>
          </div>
        </div>
        <div v-else class="no-data">
          <p>暂无辐射点统计数据</p>
        </div>
      </div>
    </div>

    <div v-if="sessions.length" class="card">
      <h2>📋 所有观测会话</h2>
      <div class="sessions-grid">
        <div class="session-item card" v-for="s in sessions" :key="s.id"
             @click="$router.push(`/session/${s.id}`)">
          <div class="session-header">
            <span :class="['badge', s.status === 'ACTIVE' ? 'badge-success' : 'badge-info']">
              {{ s.status === 'ACTIVE' ? '进行中' : '已结束' }}
            </span>
            <span class="session-location">{{ s.location }}</span>
          </div>
          <div class="session-time">
            {{ formatDate(s.startTime) }}
          </div>
          <div v-if="s.radiantConstellation" class="session-radiant">
            <span class="label">辐射点：</span>
            <span class="value">{{ s.radiantConstellation }}</span>
          </div>
          <div v-else class="session-radiant no-radiant">
            暂无辐射点计算
          </div>
          <div class="session-user" v-if="s.userName">
            👤 {{ s.userName }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showerAPI, sessionAPI } from '../api'

const route = useRoute()

const showers = ref([])
const selectedShower = ref('')
const consensusResult = ref(null)
const sessions = ref([])

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const hasCounts = computed(() => {
  return consensusResult.value && 
         Object.keys(consensusResult.value.constellationCounts || {}).length > 0
})

const sortedCounts = computed(() => {
  if (!consensusResult.value?.constellationCounts) return {}
  const counts = consensusResult.value.constellationCounts
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const result = {}
  sorted.forEach(([k, v]) => { result[k] = v })
  return result
})

const maxCount = computed(() => {
  if (!hasCounts.value) return 0
  return Math.max(...Object.values(consensusResult.value.constellationCounts))
})

const getBarWidth = (count) => {
  if (maxCount.value === 0) return 0
  return (count / maxCount.value) * 100
}

const loadData = async () => {
  if (!selectedShower.value) {
    consensusResult.value = null
    sessions.value = []
    return
  }

  try {
    const [consensusRes, sessionsRes] = await Promise.all([
      sessionAPI.getConsensus(selectedShower.value),
      sessionAPI.getByShower(selectedShower.value)
    ])
    consensusResult.value = consensusRes.data
    sessions.value = sessionsRes.data
  } catch (error) {
    console.error('加载失败:', error)
  }
}

onMounted(async () => {
  try {
    const res = await showerAPI.getAll()
    showers.value = res.data

    if (route.query.shower) {
      selectedShower.value = route.query.shower
      loadData()
    }
  } catch (error) {
    console.error('加载流星雨列表失败:', error)
  }
})
</script>

<style scoped>
.consensus {
  padding-bottom: 2rem;
}

.subtitle {
  color: #a0aec0;
  margin: 0.5rem 0 1.5rem;
}

.selector {
  max-width: 400px;
}

.consensus-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-label {
  color: #a0aec0;
}

.stat-value {
  font-weight: 600;
  color: #e2e8f0;
  font-size: 1.1rem;
}

.result-highlight {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  text-align: center;
}

.result-title {
  color: #4ade80;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.result-constellation {
  font-size: 2rem;
  font-weight: bold;
  color: #e2e8f0;
  margin: 0.5rem 0;
}

.result-coords {
  color: #a0aec0;
  margin: 0.5rem 0;
}

.result-confidence {
  margin-top: 0.5rem;
  color: #60a5fa;
  font-weight: 600;
}

.no-result {
  margin-top: 1.5rem;
  padding: 2rem;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  color: #718096;
}

.no-result .note {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bar-item {
  display: grid;
  grid-template-columns: 120px 1fr 60px;
  align-items: center;
  gap: 1rem;
}

.bar-label {
  color: #e2e8f0;
  font-weight: 500;
  font-size: 0.9rem;
}

.bar-track {
  height: 24px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #4f46e5);
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-count {
  color: #a0aec0;
  font-size: 0.875rem;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: #718096;
}

.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.session-item {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 0;
}

.session-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.2);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.session-location {
  color: #a0aec0;
  font-size: 0.9rem;
}

.session-time {
  color: #718096;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.session-radiant {
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 0.9rem;
}

.session-radiant .label {
  color: #718096;
}

.session-radiant .value {
  color: #f87171;
  font-weight: 600;
}

.session-radiant.no-radiant {
  color: #718096;
  font-style: italic;
}

.session-user {
  margin-top: 0.75rem;
  color: #a78bfa;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .bar-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .bar-count {
    text-align: right;
  }
}
</style>
