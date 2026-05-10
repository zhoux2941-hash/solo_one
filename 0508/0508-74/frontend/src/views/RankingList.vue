<template>
  <div class="ranking-page">
    <div class="page-header">
      <h2>🏆 浇水排行榜</h2>
      <div class="period-selector">
        <span class="period-label">统计周期：</span>
        <select v-model="selectedDays" @change="fetchRanking" class="period-select">
          <option :value="7">最近 7 天</option>
          <option :value="30">最近 30 天</option>
          <option :value="90">最近 90 天</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="ranking.length === 0" class="empty-state">
      <div class="empty-icon">💧</div>
      <h3>暂无浇水记录</h3>
      <p>快去给绿植浇水，争当第一名吧！</p>
    </div>

    <div v-else>
      <div class="podium">
        <div v-if="ranking[1]" class="podium-item second">
          <div class="medal">🥈</div>
          <div class="name">{{ ranking[1].username }}</div>
          <div class="count">{{ ranking[1].wateringCount }} 次</div>
          <div class="podium-stand"></div>
        </div>
        <div v-if="ranking[0]" class="podium-item first">
          <div class="crown">👑</div>
          <div class="medal">🥇</div>
          <div class="name">{{ ranking[0].username }}</div>
          <div class="count">{{ ranking[0].wateringCount }} 次</div>
          <div class="podium-stand"></div>
        </div>
        <div v-if="ranking[2]" class="podium-item third">
          <div class="medal">🥉</div>
          <div class="name">{{ ranking[2].username }}</div>
          <div class="count">{{ ranking[2].wateringCount }} 次</div>
          <div class="podium-stand"></div>
        </div>
      </div>

      <div v-if="ranking.length > 3" class="rest-list">
        <h3>其他排名</h3>
        <div class="rest-items">
          <div 
            v-for="(item, index) in ranking.slice(3)" 
            :key="item.username"
            class="rest-item"
          >
            <span class="rank-number">{{ index + 4 }}</span>
            <span class="user-name">{{ item.username }}</span>
            <span class="user-count">{{ item.wateringCount }} 次</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { plantApi } from '../api/plant'
import { usePlantWebSocket } from '../composables/usePlantWebSocket'

export default {
  name: 'RankingList',
  setup() {
    const ranking = ref([])
    const loading = ref(false)
    const selectedDays = ref(30)
    
    const { connect, disconnect, addMessageListener } = usePlantWebSocket()
    let removeListener = null

    const fetchRanking = async () => {
      try {
        loading.value = true
        const response = await plantApi.getRanking(selectedDays.value)
        ranking.value = response.data
        console.log('[Ranking] 排行榜数据:', ranking.value)
      } catch (error) {
        console.error('[Ranking] 加载排行榜失败:', error)
      } finally {
        loading.value = false
      }
    }

    const initWebSocket = () => {
      removeListener = addMessageListener(() => {
        console.log('[Ranking] 收到更新，刷新排行榜')
        fetchRanking()
      })
      connect()
    }

    onMounted(() => {
      fetchRanking()
      initWebSocket()
    })

    onUnmounted(() => {
      if (removeListener) {
        removeListener()
      }
      disconnect()
    })

    return {
      ranking,
      loading,
      selectedDays,
      fetchRanking
    }
  }
}
</script>

<style scoped>
.ranking-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h2 {
  color: white;
  font-size: 1.8rem;
}

.period-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.period-label {
  color: white;
  font-size: 0.9rem;
}

.period-select {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;
}

.loading {
  text-align: center;
  color: white;
  font-size: 1.2rem;
  padding: 3rem;
}

.empty-state {
  background: white;
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 1.5rem;
  margin-bottom: 3rem;
  min-height: 320px;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.medal {
  font-size: 2.5rem;
}

.crown {
  font-size: 1.5rem;
  margin-bottom: -0.5rem;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.name {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.count {
  color: #666;
  font-size: 0.95rem;
}

.podium-stand {
  width: 100px;
  margin-top: 0.5rem;
  border-radius: 8px 8px 0 0;
}

.podium-item.second {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem 1rem 0;
  border-radius: 12px 12px 0 0;
}

.podium-item.second .podium-stand {
  height: 100px;
  background: linear-gradient(to bottom, #e0e0e0, #a0a0a0);
}

.podium-item.first {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem 1rem 0;
  border-radius: 12px 12px 0 0;
}

.podium-item.first .podium-stand {
  height: 140px;
  background: linear-gradient(to bottom, #ffd700, #ffaa00);
}

.podium-item.third {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem 1rem 0;
  border-radius: 12px 12px 0 0;
}

.podium-item.third .podium-stand {
  height: 70px;
  background: linear-gradient(to bottom, #cd7f32, #a0522d);
}

.rest-list {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
}

.rest-list h3 {
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.rest-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rest-item {
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: background 0.2s;
}

.rest-item:hover {
  background: #f0f0f0;
}

.rank-number {
  width: 40px;
  font-weight: bold;
  color: #666;
  font-size: 1.1rem;
}

.user-name {
  flex: 1;
  color: #333;
}

.user-count {
  color: #667eea;
  font-weight: 500;
}
</style>
