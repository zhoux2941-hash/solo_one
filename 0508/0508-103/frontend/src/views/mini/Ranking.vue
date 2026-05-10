<template>
  <div class="ranking-page">
    <div class="header">
      <div class="title">🏆 积分排行榜</div>
    </div>

    <div class="eco-star-section" v-if="ecoStar && ecoStar.residentId">
      <div class="eco-star-card">
        <div class="crown">👑</div>
        <div class="star-badge">环保之星</div>
        <div class="star-avatar">
          <el-icon :size="36"><User /></el-icon>
        </div>
        <div class="star-name">{{ ecoStar.name }}</div>
        <div class="star-room">{{ ecoStar.roomNumber }}</div>
        <div class="star-points">
          <span class="points-num">{{ ecoStar.totalPoints }}</span>
          <span class="points-unit">积分</span>
        </div>
      </div>
    </div>

    <div class="tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'monthly' }"
        @click="switchTab('monthly')"
      >
        本月排行
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'total' }"
        @click="switchTab('total')"
      >
        总排行
      </div>
    </div>

    <div class="rank-list" v-if="currentRank.length > 0">
      <div 
        v-for="item in currentRank" 
        :key="item.residentId"
        class="rank-item"
        :class="'rank-' + item.rank"
      >
        <div class="rank-left">
          <div class="rank-num">
            <span v-if="item.rank === 1" class="medal">🥇</span>
            <span v-else-if="item.rank === 2" class="medal">🥈</span>
            <span v-else-if="item.rank === 3" class="medal">🥉</span>
            <span v-else class="num">{{ item.rank }}</span>
          </div>
          <div class="rank-avatar" :class="'avatar-' + item.rank">
            <el-icon><User /></el-icon>
          </div>
        </div>
        <div class="rank-middle">
          <div class="rank-name">{{ item.name }}</div>
          <div class="rank-room">{{ item.roomNumber }}</div>
        </div>
        <div class="rank-right">
          <span class="points">{{ item.totalPoints }}</span>
          <span class="unit">分</span>
        </div>
      </div>
    </div>

    <div class="empty-container" v-else>
      <el-empty description="暂无排行数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { rankingApi } from '@/api'

const activeTab = ref('monthly')
const monthlyRank = ref([])
const totalRank = ref([])
const ecoStar = ref(null)

const currentRank = computed(() => {
  return activeTab.value === 'monthly' ? monthlyRank.value : totalRank.value
})

const switchTab = (tab) => {
  activeTab.value = tab
}

const getMonthlyRank = async () => {
  const res = await rankingApi.getMonthlyRank()
  monthlyRank.value = res.data
}

const getTotalRank = async () => {
  const res = await rankingApi.getTotalRank()
  totalRank.value = res.data
}

const getEcoStar = async () => {
  const res = await rankingApi.getEcoStar()
  ecoStar.value = res.data
}

const loadAllData = async () => {
  await Promise.all([
    getMonthlyRank(),
    getTotalRank(),
    getEcoStar()
  ])
}

onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
.ranking-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 80px;
  color: #fff;
}

.title {
  font-size: 20px;
  font-weight: bold;
}

.eco-star-section {
  padding: 0 15px;
  margin-top: -50px;
}

.eco-star-card {
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.eco-star-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.crown {
  font-size: 40px;
  animation: bounce 1s ease-in-out infinite;
  margin-bottom: 5px;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.star-badge {
  display: inline-block;
  background: #e74c3c;
  color: #fff;
  padding: 2px 12px;
  border-radius: 10px;
  font-size: 12px;
  margin-bottom: 10px;
}

.star-avatar {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  color: #fff;
}

.star-name {
  font-size: 18px;
  font-weight: bold;
  color: #2d3436;
  margin-bottom: 4px;
}

.star-room {
  font-size: 12px;
  color: #636e72;
  margin-bottom: 8px;
}

.star-points {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.points-num {
  font-size: 28px;
  font-weight: bold;
  color: #e74c3c;
}

.points-unit {
  font-size: 12px;
  color: #636e72;
}

.tabs {
  display: flex;
  background: #fff;
  margin: 20px 15px;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
  transition: all 0.3s ease;
}

.tab-item.active {
  background: #409EFF;
  color: #fff;
  font-weight: bold;
}

.rank-list {
  padding: 0 15px;
}

.rank-item {
  display: flex;
  align-items: center;
  background: #fff;
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.rank-item.rank-1 {
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
}

.rank-item.rank-2 {
  background: linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%);
}

.rank-item.rank-3 {
  background: linear-gradient(135deg, #fab1a0 0%, #e17055 100%);
}

.rank-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rank-num {
  width: 30px;
  text-align: center;
}

.medal {
  font-size: 24px;
}

.num {
  display: inline-block;
  width: 26px;
  height: 26px;
  line-height: 26px;
  background: #e0e0e0;
  color: #666;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
}

.rank-avatar {
  width: 44px;
  height: 44px;
  background: #f0f9ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409EFF;
}

.avatar-1 {
  background: rgba(255, 255, 255, 0.3);
  color: #d35400;
}

.avatar-2 {
  background: rgba(255, 255, 255, 0.3);
  color: #636e72;
}

.avatar-3 {
  background: rgba(255, 255, 255, 0.3);
  color: #d35400;
}

.rank-middle {
  flex: 1;
  padding: 0 15px;
}

.rank-name {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.rank-room {
  font-size: 12px;
  color: #999;
}

.rank-right {
  text-align: right;
}

.points {
  font-size: 22px;
  font-weight: bold;
  color: #ff6b6b;
}

.unit {
  font-size: 12px;
  color: #999;
  margin-left: 2px;
}

.empty-container {
  padding: 60px 20px;
}
</style>
