<template>
  <div class="team-leaderboard">
    <div class="header">
      <h2 class="title">🏆 团队挑战赛排行榜</h2>
      <button class="refresh-btn" @click="loadRanking" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>

    <div class="top-three" v-if="ranking.length >= 3">
      <div class="podium-item second" v-if="ranking[1]">
        <div class="avatar">🥈</div>
        <div class="team-name">{{ ranking[1].teamName }}</div>
        <div class="team-dept">{{ ranking[1].department }}</div>
        <div class="team-points">{{ ranking[1].totalPoints }}分</div>
        <div class="team-avg">人均{{ ranking[1].avgPoints }}分</div>
      </div>
      
      <div class="podium-item first" v-if="ranking[0]">
        <div class="avatar">🏆</div>
        <div class="team-name">{{ ranking[0].teamName }}</div>
        <div class="team-dept">{{ ranking[0].department }}</div>
        <div class="team-points">{{ ranking[0].totalPoints }}分</div>
        <div class="team-avg">人均{{ ranking[0].avgPoints }}分</div>
      </div>
      
      <div class="podium-item third" v-if="ranking[2]">
        <div class="avatar">🥉</div>
        <div class="team-name">{{ ranking[2].teamName }}</div>
        <div class="team-dept">{{ ranking[2].department }}</div>
        <div class="team-points">{{ ranking[2].totalPoints }}分</div>
        <div class="team-avg">人均{{ ranking[2].avgPoints }}分</div>
      </div>
    </div>

    <div class="table-container" v-if="ranking.length > 0">
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>排名</th>
            <th>团队名称</th>
            <th>部门</th>
            <th>成员数</th>
            <th>总积分</th>
            <th>人均分</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(item, index) in ranking" 
            :key="item.teamId"
            :class="{ 
              'row-first': index === 0, 
              'row-second': index === 1, 
              'row-third': index === 2 
            }"
          >
            <td class="rank-cell">
              <span class="rank-number">{{ item.rank }}</span>
            </td>
            <td class="team-name-cell">{{ item.teamName }}</td>
            <td>{{ item.department }}</td>
            <td>{{ item.memberCount }}人</td>
            <td class="points-cell">{{ item.totalPoints }}</td>
            <td>{{ item.avgPoints }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="empty-state" v-else>
      <div class="empty-icon">🎯</div>
      <div class="empty-text">暂无团队数据</div>
      <div class="empty-desc">快创建或加入一个团队开始挑战吧！</div>
    </div>

    <div class="error-message" v-if="errorMessage">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import teamService from '../api/teamService.js'

const props = defineProps({
  refreshTrigger: {
    type: Number,
    default: 0
  }
})

const ranking = ref([])
const loading = ref(false)
const errorMessage = ref(null)

const loadRanking = async () => {
  loading.value = true
  errorMessage.value = null

  try {
    const result = await teamService.getTeamRanking()
    if (result.code === 200) {
      ranking.value = result.data || []
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '获取团队排行榜失败'
    console.error('获取团队排行榜失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRanking()
})

import { watch } from 'vue'
watch(() => props.refreshTrigger, () => {
  loadRanking()
})

defineExpose({
  refresh: loadRanking
})
</script>

<style scoped>
.team-leaderboard {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title {
  color: #333;
  font-size: 20px;
  margin: 0;
}

.refresh-btn {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #1976D2;
}

.refresh-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.top-three {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 32px;
  padding: 20px 0;
}

.podium-item {
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  transition: transform 0.3s;
  min-width: 150px;
}

.podium-item:hover {
  transform: translateY(-5px);
}

.podium-item.first {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  order: 2;
}

.podium-item.second {
  background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
  order: 1;
}

.podium-item.third {
  background: linear-gradient(135deg, #CD7F32, #8B4513);
  order: 3;
}

.avatar {
  font-size: 48px;
  margin-bottom: 12px;
}

.team-name {
  font-weight: 700;
  font-size: 14px;
  color: white;
  margin-bottom: 4px;
}

.team-dept {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
}

.team-points {
  font-weight: 700;
  font-size: 20px;
  color: white;
}

.team-avg {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 2px;
}

.table-container {
  overflow-x: auto;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

.leaderboard-table th {
  background: #f5f5f5;
  color: #666;
  font-weight: 600;
  font-size: 14px;
}

.leaderboard-table td {
  font-size: 14px;
}

.rank-cell {
  font-weight: 700;
}

.rank-number {
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #666;
}

.row-first .rank-number {
  background: #FFD700;
  color: #8B4513;
}

.row-second .rank-number {
  background: #C0C0C0;
  color: white;
}

.row-third .rank-number {
  background: #CD7F32;
  color: white;
}

.team-name-cell {
  font-weight: 600;
  text-align: left;
}

.points-cell {
  font-weight: 700;
  color: #FF9800;
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #999;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 6px;
  text-align: center;
}

@media (max-width: 768px) {
  .top-three {
    flex-direction: column;
    align-items: center;
  }
  
  .podium-item {
    min-width: 200px;
  }
  
  .podium-item.first {
    order: 1;
  }
  
  .podium-item.second {
    order: 2;
  }
  
  .podium-item.third {
    order: 3;
  }
}
</style>
