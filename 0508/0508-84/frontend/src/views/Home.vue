<template>
  <div class="home-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2 class="welcome">欢迎回来，{{ userStore.user?.realName }}！</h2>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" style="color: #409EFF;"><Coins /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ userStore.user?.timeCoins || 0 }}</div>
              <div class="stat-label">时间币余额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" style="color: #67C23A;"><Clock /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ totalHours }}</div>
              <div class="stat-label">累计服务时长(小时)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" style="color: #E6A23C;"><Calendar /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ activeActivities.length }}</div>
              <div class="stat-label">进行中活动</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" style="color: #F56C6C;"><ShoppingCart /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ hotGoods.length }}</div>
              <div class="stat-label">热门兑换物品</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <span>进行中的活动</span>
              <el-button type="primary" text @click="$router.push('/attendance')">去签到</el-button>
            </div>
          </template>
          <el-empty v-if="activeActivities.length === 0" description="暂无活动"></el-empty>
          <div v-else>
            <div v-for="activity in activeActivities.slice(0, 5)" :key="activity.id" class="activity-item">
              <div class="activity-name">{{ activity.name }}</div>
              <div class="activity-info">
                <span>{{ formatTime(activity.startTime) }} - {{ formatTime(activity.endTime) }}</span>
                <el-tag type="success">进行中</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <span>热门兑换物品</span>
              <el-button type="primary" text @click="$router.push('/mall')">去商城</el-button>
            </div>
          </template>
          <el-empty v-if="hotGoods.length === 0" description="暂无热门物品"></el-empty>
          <div v-else class="hot-goods-list">
            <div v-for="goods in hotGoods.slice(0, 5)" :key="goods.id" class="goods-item">
              <div class="goods-info">
                <div class="goods-name">{{ goods.name }}</div>
                <div class="goods-coins">{{ goods.coinsRequired }} 时间币</div>
              </div>
              <el-tag type="warning">库存: {{ goods.stock }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { getActiveActivities } from '../api/activity'
import { getHotGoods } from '../api/goods'
import { getTotalMinutes } from '../api/attendance'
import { Coins, Clock, Calendar, ShoppingCart } from '@element-plus/icons-vue'

const userStore = useUserStore()
const activeActivities = ref([])
const hotGoods = ref([])
const totalMinutes = ref(0)

const totalHours = computed(() => (totalMinutes.value / 60).toFixed(1))

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(async () => {
  const [activitiesRes, goodsRes, minutesRes] = await Promise.all([
    getActiveActivities(),
    getHotGoods(),
    getTotalMinutes(userStore.user.id)
  ])
  activeActivities.value = activitiesRes.data
  hotGoods.value = goodsRes.data
  totalMinutes.value = minutesRes.data
  await userStore.refreshUser()
})
</script>

<style scoped>
.home-container {
  max-width: 1400px;
  margin: 0 auto;
}

.welcome {
  margin-bottom: 20px;
  color: #333;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 48px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.section-card {
  margin-top: 20px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.activity-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #909399;
}

.hot-goods-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goods-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.goods-name {
  font-size: 15px;
  font-weight: 500;
}

.goods-coins {
  font-size: 13px;
  color: #E6A23C;
  margin-top: 3px;
}
</style>
