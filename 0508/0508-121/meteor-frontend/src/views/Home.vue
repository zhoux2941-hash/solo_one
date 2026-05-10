<template>
  <div class="home">
    <div class="hero">
      <h1>流星雨观测记录系统</h1>
      <p>记录你的流星观测，共同探索流星雨的奥秘</p>
      <button class="btn btn-primary start-btn" @click="$router.push('/observation')">
        🚀 开始新观测
      </button>
    </div>

    <div class="section">
      <h2>🌟 热门流星雨</h2>
      <div class="showers-grid" v-if="hotShowers.length">
        <div class="shower-card card" v-for="shower in hotShowers" :key="shower.id">
          <div class="shower-header">
            <span class="shower-name">{{ shower.chineseName || shower.name }}</span>
            <span class="badge badge-warning" v-if="shower.isHot">热门</span>
          </div>
          <div class="shower-info">
            <p><strong>英文名：</strong>{{ shower.name }}</p>
            <p><strong>代码：</strong>{{ shower.code }}</p>
            <p><strong>辐射点：</strong>{{ shower.radiantConstellation }}</p>
            <p><strong>极大期：</strong>{{ formatDate(shower.peakTime) }}</p>
            <p v-if="shower.predictedZHR">
              <strong>预报 ZHR：</strong>
              <span class="zhr-badge">{{ shower.predictedZHR }}</span>
            </p>
          </div>
          <button class="btn btn-secondary" @click="viewSessions(shower.name)">
            查看观测记录 ({{ showerCounts[shower.name] || 0 }})
          </button>
        </div>
      </div>
      <p v-else class="empty">加载中...</p>
    </div>

    <div class="section">
      <h2>🔭 活跃观测会话</h2>
      <div class="sessions-list" v-if="activeSessions.length">
        <div class="session-item card" v-for="session in activeSessions" :key="session.id">
          <div class="session-info">
            <h3>{{ session.meteorShowerName }}</h3>
            <p><strong>地点：</strong>{{ session.location }}</p>
            <p><strong>开始时间：</strong>{{ formatDate(session.startTime) }}</p>
            <p v-if="session.userName"><strong>观测者：</strong>{{ session.userName }}</p>
          </div>
          <span class="badge badge-success">进行中</span>
          <button class="btn btn-primary" @click="$router.push(`/session/${session.id}`)">
            查看详情
          </button>
        </div>
      </div>
      <p v-else class="empty">暂无活跃的观测会话</p>
    </div>

    <div class="section">
      <h2>✨ 所有流星雨</h2>
      <div class="showers-grid">
        <div class="shower-card card" v-for="shower in allShowers" :key="shower.id">
          <div class="shower-header">
            <span class="shower-name">{{ shower.chineseName || shower.name }}</span>
            <span class="badge badge-warning" v-if="shower.isHot">热门</span>
          </div>
          <p>{{ shower.name }} - {{ shower.code }}</p>
          <p>极大期：{{ formatDate(shower.peakTime) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showerAPI, sessionAPI } from '../api'

const router = useRouter()
const hotShowers = ref([])
const allShowers = ref([])
const activeSessions = ref([])
const showerCounts = ref({})

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

const viewSessions = (showerName) => {
  router.push({ path: '/consensus', query: { shower: showerName } })
}

onMounted(async () => {
  try {
    const [hotRes, allRes, activeRes] = await Promise.all([
      showerAPI.getHot(),
      showerAPI.getAll(),
      sessionAPI.getActive()
    ])
    hotShowers.value = hotRes.data
    allShowers.value = allRes.data
    activeSessions.value = activeRes.data

    for (const shower of hotShowers.value) {
      try {
        const countRes = await sessionAPI.getByShower(shower.name)
        showerCounts.value[shower.name] = countRes.data.length
      } catch (e) {
        showerCounts.value[shower.name] = 0
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})
</script>

<style scoped>
.home {
  padding-bottom: 2rem;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%);
  border-radius: 16px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #a78bfa, #60a5fa, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero p {
  font-size: 1.25rem;
  color: #a0aec0;
  margin-bottom: 2rem;
}

.start-btn {
  font-size: 1.25rem;
  padding: 1rem 3rem;
}

.section {
  margin-bottom: 3rem;
}

.section h2 {
  margin-bottom: 1.5rem;
  color: #e2e8f0;
  font-size: 1.5rem;
}

.showers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.shower-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.shower-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(124, 58, 237, 0.2);
}

.shower-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.shower-name {
  font-size: 1.25rem;
  font-weight: bold;
  color: #e2e8f0;
}

.shower-info p {
  margin: 0.5rem 0;
  color: #a0aec0;
}

.shower-info strong {
  color: #cbd5e0;
}

.zhr-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  margin-left: 0.25rem;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1.5rem;
}

.session-info h3 {
  margin-bottom: 0.5rem;
  color: #e2e8f0;
}

.session-info p {
  margin: 0.25rem 0;
  color: #a0aec0;
  font-size: 0.9rem;
}

.empty {
  text-align: center;
  color: #718096;
  padding: 2rem;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .session-item {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
