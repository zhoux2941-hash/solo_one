<template>
  <div class="home-page">
    <div class="nav-tabs">
      <el-tabs v-model="activeNav">
        <el-tab-pane label="首页" name="home"></el-tab-pane>
        <el-tab-pane label="地图打卡" name="map" @click="goTo('/map')"></el-tab-pane>
        <el-tab-pane label="流浪救助" name="rescue" @click="goTo('/rescue')"></el-tab-pane>
        <el-tab-pane label="排行榜" name="ranking" @click="goTo('/ranking')"></el-tab-pane>
        <el-tab-pane label="个人中心" name="profile" @click="goTo('/profile')"></el-tab-pane>
        <el-tab-pane
          v-if="currentUser?.isAdmin"
          label="管理员"
          name="admin"
          @click="goTo('/admin')"
        ></el-tab-pane>
      </el-tabs>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ communityStats?.totalCleanliness || 0 }}</div>
          <div class="stat-label">小区清洁值</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div class="stat-value">{{ communityStats?.totalRecords || 0 }}</div>
          <div class="stat-label">累计清理次数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
          <div class="stat-value">{{ rescueStats.needRescue || 0 }}</div>
          <div class="stat-label">待救助动物</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <div class="stat-value">{{ currentUser?.totalPoints || 0 }}</div>
          <div class="stat-label">我的积分</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="action-row">
      <el-col :span="8">
        <div class="action-card" @click="$router.push('/map')">
          <el-icon :size="48"><MapLocation /></el-icon>
          <h3>清洁打卡</h3>
          <p>在地图上标记清理位置，上传照片</p>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="action-card rescue-card" @click="$router.push('/rescue')">
          <el-icon :size="48"><HelpFilled /></el-icon>
          <h3>流浪救助</h3>
          <p>报告发现流浪动物，参与救助</p>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="action-card" @click="$router.push('/ranking')">
          <el-icon :size="48"><Trophy /></el-icon>
          <h3>排行榜</h3>
          <p>查看个人积分和楼栋积分排名</p>
        </div>
      </el-col>
    </el-row>

    <div class="card-container recent-section">
      <h2 class="section-title">
        <el-icon><Clock /></el-icon>
        最近的清理点
      </h2>
      <el-table :data="recentPoints" v-if="recentPoints.length > 0">
        <el-table-column label="位置" prop="id" width="120">
          <template #default="{ row }">
            清理点 #{{ row.id }}
          </template>
        </el-table-column>
        <el-table-column label="纬度" prop="latitude" />
        <el-table-column label="经度" prop="longitude" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'clean' ? 'success' : 'danger'" size="small">
              {{ row.status === 'clean' ? '已清理' : '待清理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上次清理时间" prop="lastCleanTime">
          <template #default="{ row }">
            {{ formatTime(row.lastCleanTime) }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无清理点，快去打卡吧！" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const activeNav = ref('home')
const communityStats = ref(null)
const rescueStats = ref({})
const recentPoints = ref([])
const currentUser = ref(null)

onMounted(async () => {
  const user = localStorage.getItem('currentUser')
  if (user) {
    currentUser.value = JSON.parse(user)
  }
  await loadStats()
  await loadRescueStats()
  await loadRecentPoints()
})

const goTo = (path) => {
  router.push(path)
}

const loadStats = async () => {
  try {
    const res = await api.getCommunityStats()
    communityStats.value = res.data
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

const loadRescueStats = async () => {
  try {
    const res = await api.getRescueStats()
    rescueStats.value = res.data
  } catch (e) {
    console.error('加载救助统计失败', e)
  }
}

const loadRecentPoints = async () => {
  try {
    const res = await api.getCleaningPoints()
    recentPoints.value = res.data.slice(0, 5)
  } catch (e) {
    console.error('加载清理点失败', e)
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.home-page {
  .nav-tabs {
    background: white;
    border-radius: 12px;
    padding: 0 16px;
    margin-bottom: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
    }
  }

  .stats-row {
    margin-bottom: 24px;
  }

  .action-row {
    margin-bottom: 24px;

    .action-card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      h3 {
        font-size: 18px;
        margin: 16px 0 8px;
        color: #303133;
      }

      p {
        color: #909399;
        font-size: 14px;
      }

      &.rescue-card {
        background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);

        h3, p {
          color: white;
        }
      }
    }
  }

  .recent-section {
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #303133;
    }
  }
}
</style>
