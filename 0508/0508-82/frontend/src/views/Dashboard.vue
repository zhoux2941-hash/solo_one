<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>快速入口</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button
              v-if="authStore.isHost"
              type="primary"
              size="large"
              style="width: 100%; margin-bottom: 10px"
              @click="router.push('/host')"
            >
              <el-icon><Monitor /></el-icon>
              主持面板
            </el-button>
            <el-button
              type="success"
              size="large"
              style="width: 100%; margin-bottom: 10px"
              @click="router.push('/team')"
            >
              <el-icon><User /></el-icon>
              参赛面板
            </el-button>
            <el-button
              v-if="authStore.isHost"
              type="warning"
              size="large"
              style="width: 100%; margin-bottom: 10px"
              @click="router.push('/competitions')"
            >
              <el-icon><Tickets /></el-icon>
              竞赛管理
            </el-button>
            <el-button
              v-if="authStore.isHost"
              type="info"
              size="large"
              style="width: 100%"
              @click="router.push('/questions')"
            >
              <el-icon><Document /></el-icon>
              题库管理
            </el-button>
            <el-button
              type="warning"
              size="large"
              style="width: 100%; margin-top: 10px"
              @click="openInNewTab('/audience')"
            >
              <el-icon><View /></el-icon>
              观众观赛
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近竞赛</span>
              <el-button type="text" @click="loadCompetitions">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table :data="competitions" v-loading="loading" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="竞赛名称" />
            <el-table-column label="队伍数量" width="100">
              <template #default="{ row }">
                {{ row.teamCount }} 支
              </template>
            </el-table-column>
            <el-table-column label="题目数量" width="100">
              <template #default="{ row }">
                {{ row.questionCount }} 道
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <span :class="['status-badge', `status-${row.status.toLowerCase()}`]">
                  {{ getStatusText(row.status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="viewCompetition(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getCompetitions } from '../api/competitions'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const competitions = ref([])
const loading = ref(false)

function getStatusText(status) {
  const statusMap = {
    'CREATED': '已创建',
    'IN_PROGRESS': '进行中',
    'FINISHED': '已结束'
  }
  return statusMap[status] || status
}

async function loadCompetitions() {
  loading.value = true
  try {
    const response = await getCompetitions()
    competitions.value = response.data
  } catch (error) {
    ElMessage.error('加载竞赛列表失败')
  } finally {
    loading.value = false
  }
}

function viewCompetition(competition) {
  if (competition.status === 'FINISHED') {
    router.push(`/results/${competition.id}`)
  } else {
    router.push(`/competition/${competition.id}`)
  }
}

function openInNewTab(path) {
  const url = window.location.origin + path
  window.open(url, '_blank')
}

onMounted(() => {
  loadCompetitions()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}
</style>
