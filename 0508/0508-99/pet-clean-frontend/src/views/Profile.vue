<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <div class="card-container profile-card">
          <div class="avatar-section">
            <el-avatar :size="80" icon="UserFilled" />
            <h2 class="nickname">{{ currentUser?.nickname }}</h2>
            <p class="username">@{{ currentUser?.username }}</p>
            <el-tag v-if="currentUser?.isAdmin" type="warning" effect="dark">管理员</el-tag>
          </div>

          <div class="stats-section">
            <div class="stat-item">
              <div class="stat-value">{{ currentUser?.totalPoints || 0 }}</div>
              <div class="stat-label">总积分</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ buildingName }}</div>
              <div class="stat-label">所属楼栋</div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="16">
        <div class="card-container">
          <h2 class="section-title">
            <el-icon><Clock /></el-icon>
            我的打卡记录
          </h2>
          <el-table :data="records" v-if="records.length > 0" stripe>
            <el-table-column label="时间" prop="createdAt" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="清理点ID" prop="cleaningPointId" width="120" />
            <el-table-column label="位置">
              <template #default="{ row }">
                <div v-if="getPointInfo(row.cleaningPointId)">
                  {{ getPointInfo(row.cleaningPointId).latitude }}, {{ getPointInfo(row.cleaningPointId).longitude }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="获得积分" prop="pointsEarned" width="120">
              <template #default="{ row }">
                <el-tag type="success">+{{ row.pointsEarned }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="照片">
              <template #default="{ row }">
                <el-image
                  v-if="row.photoUrl"
                  :src="row.photoUrl"
                  :preview-src-list="[row.photoUrl]"
                  fit="cover"
                  style="width: 60px; height: 60px; border-radius: 4px;"
                />
                <span v-else class="no-photo">无照片</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无打卡记录" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const currentUser = ref(null)
const records = ref([])
const buildings = ref([])
const points = ref([])

const buildingName = computed(() => {
  if (!currentUser.value?.buildingId) return '未绑定'
  const building = buildings.value.find(b => b.id === currentUser.value.buildingId)
  return building ? building.name : '未绑定'
})

onMounted(async () => {
  const user = localStorage.getItem('currentUser')
  if (!user) {
    return
  }
  currentUser.value = JSON.parse(user)
  await loadData()
})

const loadData = async () => {
  try {
    const [recordsRes, buildingsRes, pointsRes] = await Promise.all([
      api.getUserRecords(currentUser.value.id),
      api.getBuildings(),
      api.getCleaningPoints()
    ])
    records.value = recordsRes.data
    buildings.value = buildingsRes.data
    points.value = pointsRes.data
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

const getPointInfo = (pointId) => {
  return points.value.find(p => p.id === pointId)
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.profile-page {
  .profile-card {
    .avatar-section {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #f0f0f0;
      margin-bottom: 24px;

      .nickname {
        margin: 16px 0 8px;
        font-size: 24px;
        color: #303133;
      }

      .username {
        color: #909399;
        margin-bottom: 12px;
      }
    }

    .stats-section {
      display: flex;
      justify-content: space-around;

      .stat-item {
        text-align: center;

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #303133;
  }

  .no-photo {
    color: #c0c4cc;
    font-size: 14px;
  }
}
</style>
