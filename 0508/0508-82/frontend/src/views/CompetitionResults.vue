<template>
  <div class="competition-results">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>🏆 竞赛成绩</span>
        </div>
      </template>

      <div v-if="statistics?.winner" class="winner-section">
        <div class="winner-banner">
          🎉 恭喜 {{ statistics.winner.name }} 获得冠军！
        </div>
        <div class="winner-score">
          总分: <strong>{{ statistics.winner.score }}</strong>
        </div>
      </div>

      <h3 style="margin-top: 20px; margin-bottom: 15px">最终排名</h3>
      <el-table :data="statistics?.teams" stripe>
        <el-table-column type="index" label="排名" width="100">
          <template #default="{ $index }">
            <span v-if="$index === 0" class="medal gold">🥇 冠军</span>
            <span v-else-if="$index === 1" class="medal silver">🥈 亚军</span>
            <span v-else-if="$index === 2" class="medal bronze">🥉 季军</span>
            <span v-else>第 {{ $index + 1 }} 名</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="队伍名称">
          <template #default="{ row, $index }">
            <span :class="`rank-${$index}`">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="总分" width="120">
          <template #default="{ row }">
            <strong style="font-size: 18px">{{ row.score }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="答题统计" width="300">
          <template #default="{ row }">
            <el-progress
              :percentage="calculateAccuracy(row)"
              :format="() => `正确率: ${calculateAccuracy(row)}%`"
              :color="getProgressColor(calculateAccuracy(row))"
              :stroke-width="12"
            />
            <div style="margin-top: 5px">
              <span style="color: #67c23a">正确: {{ row.correctCount }}</span>
              <span style="margin: 0 10px">|</span>
              <span style="color: #f56c6c">错误: {{ row.wrongCount }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-row :gutter="20" style="margin-top: 30px">
        <el-col :span="8">
          <el-card>
            <div class="stat-item">
              <div class="stat-value">{{ statistics?.totalAnswers || 0 }}</div>
              <div class="stat-label">总答题数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <div class="stat-item">
              <div class="stat-value" style="color: #67c23a">{{ statistics?.correctAnswers || 0 }}</div>
              <div class="stat-label">正确答题</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <div class="stat-item">
              <div class="stat-value" style="color: #f56c6c">{{ statistics?.wrongAnswers || 0 }}</div>
              <div class="stat-label">错误答题</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div style="margin-top: 20px">
        <el-button @click="router.back()">返回</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStatistics } from '../api/competitions'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const statistics = ref(null)
const loading = ref(false)

function calculateAccuracy(team) {
  const total = team.correctCount + team.wrongCount
  if (total === 0) return 0
  return Math.round((team.correctCount / total) * 100)
}

function getProgressColor(percentage) {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

async function loadStatistics() {
  loading.value = true
  try {
    const response = await getStatistics(route.params.id)
    statistics.value = response.data
  } catch (error) {
    ElMessage.error('加载成绩统计失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.card-header {
  font-size: 20px;
  font-weight: bold;
}

.winner-section {
  text-align: center;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.winner-banner {
  font-size: 28px;
  font-weight: bold;
  color: white;
  margin-bottom: 10px;
}

.winner-score {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
}

.medal {
  font-weight: bold;
}

.medal.gold {
  color: #f0ad4e;
}

.medal.silver {
  color: #949aa7;
}

.medal.bronze {
  color: #c08851;
}

.rank-0 {
  font-weight: bold;
  color: #f0ad4e;
  font-size: 18px;
}

.rank-1 {
  font-weight: bold;
  color: #949aa7;
}

.rank-2 {
  font-weight: bold;
  color: #c08851;
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}
</style>
