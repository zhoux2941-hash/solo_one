<template>
  <div class="competition-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>{{ competition?.name }}</span>
          <div>
            <span :class="['status-badge', `status-${competition?.status?.toLowerCase()}`]">
              {{ getStatusText(competition?.status) }}
            </span>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="竞赛名称">{{ competition?.name }}</el-descriptions-item>
        <el-descriptions-item label="队伍数量">{{ competition?.teamCount }} 支</el-descriptions-item>
        <el-descriptions-item label="题目数量">{{ competition?.questionCount }} 道</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(competition?.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ competition?.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <h3 style="margin-top: 30px; margin-bottom: 15px">队伍排名</h3>
      <el-table :data="teams" stripe>
        <el-table-column type="index" label="排名" width="80">
          <template #default="{ $index }">
            <span v-if="$index === 0" style="color: #f0ad4e; font-weight: bold">🥇</span>
            <span v-else-if="$index === 1" style="color: #949aa7; font-weight: bold">🥈</span>
            <span v-else-if="$index === 2" style="color: #c08851; font-weight: bold">🥉</span>
            <span v-else>{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="队伍名称" />
        <el-table-column prop="score" label="分数" width="120">
          <template #default="{ row }">
            <strong>{{ row.score }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="答题统计" width="200">
          <template #default="{ row }">
            <span style="color: #67c23a">正确: {{ row.correctCount }}</span>
            <span style="margin: 0 10px">|</span>
            <span style="color: #f56c6c">错误: {{ row.wrongCount }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px">
        <el-button
          v-if="competition?.status === 'CREATED' && authStore.isHost"
          type="success"
          @click="enterHostPanel"
        >
          进入主持面板
        </el-button>
        <el-button
          v-if="competition?.status === 'IN_PROGRESS'"
          type="primary"
          @click="enterAsTeam"
        >
          作为队伍参赛
        </el-button>
        <el-button
          v-if="competition?.status === 'FINISHED'"
          type="success"
          @click="viewResults"
        >
          查看详细成绩
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getCompetition, getTeams } from '../api/competitions'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const competition = ref(null)
const teams = ref([])
const loading = ref(false)

function getStatusText(status) {
  const statusMap = {
    'CREATED': '已创建',
    'IN_PROGRESS': '进行中',
    'FINISHED': '已结束'
  }
  return statusMap[status] || status
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    const [compRes, teamsRes] = await Promise.all([
      getCompetition(route.params.id),
      getTeams(route.params.id)
    ])
    competition.value = compRes.data
    teams.value = teamsRes.data
  } catch (error) {
    ElMessage.error('加载竞赛信息失败')
  } finally {
    loading.value = false
  }
}

function enterHostPanel() {
  router.push('/host')
}

function enterAsTeam() {
  router.push('/team')
}

function viewResults() {
  router.push(`/results/${route.params.id}`)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
