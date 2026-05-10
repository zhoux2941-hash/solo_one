<template>
  <div class="ranking-page">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="eco-star-card">
          <template #header>
            <div class="card-header">
              <span>🌟 本月环保之星</span>
              <div>
                <el-date-picker
                  v-model="selectedDate"
                  type="month"
                  placeholder="选择月份"
                  value-format="YYYY-MM"
                  style="width: 200px; margin-right: 10px;"
                  @change="onDateChange"
                />
                <el-button type="primary" @click="refreshAll">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="eco-star-content" v-if="ecoStar && ecoStar.residentId">
            <div class="star-crown">👑</div>
            <div class="star-avatar">
              <el-icon :size="50"><User /></el-icon>
            </div>
            <div class="star-info">
              <div class="star-name">{{ ecoStar.name }}</div>
              <div class="star-room">{{ ecoStar.roomNumber }}</div>
              <div class="star-points">
                <el-tag type="warning" size="large">{{ ecoStar.totalPoints }} 积分</el-tag>
              </div>
              <div class="star-title">{{ ecoStar.title }}</div>
            </div>
          </div>
          <el-empty v-else description="本月暂无环保之星" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>📊 本月积分排行榜 TOP 10</span>
          </template>
          
          <div class="rank-list" v-if="monthlyRank.length > 0">
            <div 
              v-for="(item, index) in monthlyRank" 
              :key="item.residentId"
              class="rank-item"
              :class="'rank-' + item.rank"
            >
              <div class="rank-num">
                <span v-if="item.rank === 1" class="medal gold">🥇</span>
                <span v-else-if="item.rank === 2" class="medal silver">🥈</span>
                <span v-else-if="item.rank === 3" class="medal bronze">🥉</span>
                <span v-else class="num">{{ item.rank }}</span>
              </div>
              <div class="rank-info">
                <div class="rank-name">{{ item.name }}</div>
                <div class="rank-room">{{ item.roomNumber }}</div>
              </div>
              <div class="rank-points">
                {{ item.totalPoints }} <span class="unit">分</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无排行数据" />
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>🏆 历史总积分排行榜 TOP 10</span>
          </template>
          
          <div class="rank-list" v-if="totalRank.length > 0">
            <div 
              v-for="(item, index) in totalRank" 
              :key="item.residentId"
              class="rank-item"
              :class="'rank-' + item.rank"
            >
              <div class="rank-num">
                <span v-if="item.rank === 1" class="medal gold">🥇</span>
                <span v-else-if="item.rank === 2" class="medal silver">🥈</span>
                <span v-else-if="item.rank === 3" class="medal bronze">🥉</span>
                <span v-else class="num">{{ item.rank }}</span>
              </div>
              <div class="rank-info">
                <div class="rank-name">{{ item.name }}</div>
                <div class="rank-room">{{ item.roomNumber }}</div>
              </div>
              <div class="rank-points">
                {{ item.totalPoints }} <span class="unit">分</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无排行数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { rankingApi } from '@/api'

const selectedDate = ref('')
const monthlyRank = ref([])
const totalRank = ref([])
const ecoStar = ref(null)

const currentYear = computed(() => {
  if (!selectedDate.value) return null
  return parseInt(selectedDate.value.split('-')[0])
})

const currentMonth = computed(() => {
  if (!selectedDate.value) return null
  return parseInt(selectedDate.value.split('-')[1])
})

const getMonthlyRank = async () => {
  const res = await rankingApi.getMonthlyRank({
    year: currentYear.value,
    month: currentMonth.value
  })
  monthlyRank.value = res.data
}

const getTotalRank = async () => {
  const res = await rankingApi.getTotalRank()
  totalRank.value = res.data
}

const getEcoStar = async () => {
  const res = await rankingApi.getEcoStar({
    year: currentYear.value,
    month: currentMonth.value
  })
  ecoStar.value = res.data
}

const loadAllData = async () => {
  await Promise.all([
    getMonthlyRank(),
    getTotalRank(),
    getEcoStar()
  ])
}

const onDateChange = async () => {
  await Promise.all([getMonthlyRank(), getEcoStar()])
}

const refreshAll = async () => {
  await rankingApi.refreshCache({
    year: currentYear.value,
    month: currentMonth.value
  })
  await loadAllData()
  ElMessage.success('刷新成功')
}

onMounted(async () => {
  const now = new Date()
  selectedDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  await loadAllData()
})
</script>

<style scoped>
.ranking-page {
  padding: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.eco-star-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.eco-star-card :deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: none;
  color: #fff;
}

.eco-star-card :deep(.el-card__body) {
  background: transparent;
}

.eco-star-content {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 20px;
  color: #fff;
}

.star-crown {
  font-size: 60px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.star-avatar {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.star-info {
  flex: 1;
}

.star-name {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.star-room {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 12px;
}

.star-points {
  margin-bottom: 12px;
}

.star-title {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
}

.rank-list {
  max-height: 500px;
  overflow-y: auto;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.rank-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

.rank-num {
  width: 50px;
  text-align: center;
}

.medal {
  font-size: 28px;
}

.num {
  display: inline-block;
  width: 30px;
  height: 30px;
  line-height: 30px;
  background: #409EFF;
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
}

.rank-info {
  flex: 1;
  padding: 0 15px;
}

.rank-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.rank-room {
  font-size: 12px;
  color: #999;
}

.rank-points {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
}

.rank-points .unit {
  font-size: 14px;
  font-weight: normal;
  color: #999;
}
</style>
