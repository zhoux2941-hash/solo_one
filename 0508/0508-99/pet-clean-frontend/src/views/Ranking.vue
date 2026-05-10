<template>
  <div class="ranking-page">
    <el-tabs v-model="activeTab" class="ranking-tabs">
      <el-tab-pane label="个人排行榜" name="user">
        <div class="card-container">
          <el-table :data="userRankings" stripe>
            <el-table-column label="排名" width="100">
              <template #default="{ $index }">
                <el-tag
                  :type="getRankType($index)"
                  :effect="$index < 3 ? 'dark' : 'plain'"
                >
                  {{ $index + 1 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="用户" prop="nickname">
              <template #default="{ row }">
                <div class="user-cell">
                  <el-avatar :size="32" icon="UserFilled" />
                  <span class="nickname">{{ row.nickname }}</span>
                  <el-tag v-if="row.isAdmin" type="warning" size="small">管理员</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="楼栋">
              <template #default="{ row }">
                {{ getBuildingName(row.buildingId) }}
              </template>
            </el-table-column>
            <el-table-column label="积分" prop="totalPoints" width="150">
              <template #default="{ row }">
                <el-tag type="success">{{ row.totalPoints }} 分</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="楼栋排行榜" name="building">
        <div class="card-container">
          <el-table :data="buildingRankings" stripe>
            <el-table-column label="排名" width="100">
              <template #default="{ $index }">
                <el-tag
                  :type="getRankType($index)"
                  :effect="$index < 3 ? 'dark' : 'plain'"
                >
                  {{ $index + 1 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="楼栋" prop="name">
              <template #default="{ row }">
                <div class="building-cell">
                  <el-icon :size="24"><OfficeBuilding /></el-icon>
                  <span class="building-name">{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="总积分" prop="totalPoints" width="200">
              <template #default="{ row }">
                <div class="points-progress">
                  <el-progress
                    :percentage="getPercentage(row.totalPoints)"
                    :show-text="false"
                    :color="getProgressColor(row.totalPoints)"
                  />
                  <span class="points-text">{{ row.totalPoints }} 分</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/api'

const activeTab = ref('user')
const userRankings = ref([])
const buildingRankings = ref([])
const buildings = ref([])

const maxBuildingPoints = computed(() => {
  if (buildingRankings.value.length === 0) return 0
  return Math.max(...buildingRankings.value.map(b => b.totalPoints))
})

onMounted(async () => {
  await loadRankings()
})

const loadRankings = async () => {
  try {
    const [usersRes, buildingsRes, allBuildingsRes] = await Promise.all([
      api.getUsersRanked(),
      api.getBuildingsRanked(),
      api.getBuildings()
    ])
    userRankings.value = usersRes.data
    buildingRankings.value = buildingsRes.data
    buildings.value = allBuildingsRes.data
  } catch (e) {
    console.error('加载排行榜失败', e)
  }
}

const getRankType = (index) => {
  if (index === 0) return 'warning'
  if (index === 1) return 'info'
  if (index === 2) return 'danger'
  return ''
}

const getBuildingName = (buildingId) => {
  if (!buildingId) return '未绑定'
  const building = buildings.value.find(b => b.id === buildingId)
  return building ? building.name : '未绑定'
}

const getPercentage = (points) => {
  if (maxBuildingPoints.value === 0) return 0
  return Math.round((points / maxBuildingPoints.value) * 100)
}

const getProgressColor = (points) => {
  const percentage = getPercentage(points)
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#909399'
}
</script>

<style lang="scss" scoped>
.ranking-page {
  .ranking-tabs {
    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
    }
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .nickname {
      font-weight: 500;
      color: #303133;
    }
  }

  .building-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .building-name {
      font-weight: 500;
      color: #303133;
      font-size: 16px;
    }
  }

  .points-progress {
    display: flex;
    align-items: center;
    gap: 16px;

    .el-progress {
      flex: 1;
      max-width: 200px;
    }

    .points-text {
      font-weight: 600;
      color: #67c23a;
      min-width: 60px;
    }
  }
}
</style>
