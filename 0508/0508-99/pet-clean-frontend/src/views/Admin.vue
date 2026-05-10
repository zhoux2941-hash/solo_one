<template>
  <div class="admin-page">
    <el-alert
      v-if="!currentUser?.isAdmin"
      title="需要管理员权限"
      type="warning"
      show-icon
    />

    <template v-else>
      <div class="card-container">
        <h2 class="section-title">
          <el-icon><UserFilled /></el-icon>
          所有清理点
          <span class="tip">管理员可将清理点标记为"待清理"，模拟出现新粪便</span>
        </h2>

        <el-table :data="cleaningPoints" stripe>
          <el-table-column label="ID" prop="id" width="80" />
          <el-table-column label="纬度" prop="latitude" />
          <el-table-column label="经度" prop="longitude" />
          <el-table-column label="描述" prop="description" />
          <el-table-column label="状态" prop="status" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'clean' ? 'success' : 'danger'">
                {{ row.status === 'clean' ? '已清理' : '待清理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="上次清理时间" prop="lastCleanTime" width="180">
            <template #default="{ row }">
              {{ formatTime(row.lastCleanTime) }}
            </template>
          </el-table-column>
          <el-table-column label="上次清理用户" prop="lastCleanUserId" width="120">
            <template #default="{ row }">
              {{ getUserName(row.lastCleanUserId) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'clean'"
                type="danger"
                size="small"
                :loading="markingPointId === row.id"
                @click="markAsPending(row.id)"
              >
                标记待清理
              </el-button>
              <span v-else class="action-disabled">已标记</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="card-container">
        <h2 class="section-title">
          <el-icon><Warning /></el-icon>
          待清理清理点
        </h2>
        <el-empty v-if="pendingPoints.length === 0" description="暂无待清理位置" />
        <el-table :data="pendingPoints" stripe v-else>
          <el-table-column label="ID" prop="id" width="80" />
          <el-table-column label="位置">
            <template #default="{ row }">
              {{ row.latitude }}, {{ row.longitude }}
            </template>
          </el-table-column>
          <el-table-column label="上次清理时间" prop="lastCleanTime" width="180">
            <template #default="{ row }">
              {{ formatTime(row.lastCleanTime) }}
            </template>
          </el-table-column>
          <el-table-column label="通知接收用户" prop="lastCleanUserId" width="120">
            <template #default="{ row }">
              {{ getUserName(row.lastCleanUserId) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const currentUser = ref(null)
const cleaningPoints = ref([])
const users = ref([])
const markingPointId = ref(null)

const pendingPoints = computed(() => {
  return cleaningPoints.value.filter(p => p.status === 'pending')
})

onMounted(async () => {
  const user = localStorage.getItem('currentUser')
  if (!user) {
    ElMessage.warning('请先登录')
    return
  }
  currentUser.value = JSON.parse(user)

  if (currentUser.value.isAdmin) {
    await loadData()
  }
})

const loadData = async () => {
  try {
    const [pointsRes, usersRes] = await Promise.all([
      api.getCleaningPoints(),
      api.getUsers()
    ])
    cleaningPoints.value = pointsRes.data
    users.value = usersRes.data
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

const getUserName = (userId) => {
  if (!userId) return '未知'
  const user = users.value.find(u => u.id === userId)
  return user ? user.nickname : '未知'
}

const markAsPending = async (pointId) => {
  try {
    await ElMessageBox.confirm(
      '确认将该清理点标记为"待清理"吗？这会通知上次清理该区域的用户。',
      '确认操作',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    markingPointId.value = pointId
    await api.markPointAsPending(pointId)
    ElMessage.success('已标记为待清理，通知已发送')
    await loadData()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  } finally {
    markingPointId.value = null
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.admin-page {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #303133;

    .tip {
      font-size: 14px;
      font-weight: normal;
      color: #909399;
      margin-left: 12px;
    }
  }

  .action-disabled {
    color: #c0c4cc;
    font-size: 14px;
  }

  :deep(.el-table) {
    margin-bottom: 24px;
  }
}
</style>
