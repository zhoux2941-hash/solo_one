<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">失物招领平台</h1>
        <p class="hero-subtitle">智能匹配，让每一件失物都能找到回家的路</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="router.push('/publish-lost')">
            <el-icon><Lost /></el-icon>
            我丢了东西
          </el-button>
          <el-button size="large" @click="router.push('/publish-found')">
            <el-icon><Found /></el-icon>
            我捡到了东西
          </el-button>
        </div>
      </div>
    </div>

    <div class="page-container">
      <div class="section">
        <h2 class="section-title">
          <el-icon><TrendCharts /></el-icon>
          热门搜索
        </h2>
        <div v-if="hotKeywords.length > 0" class="hot-tags">
          <el-tag
            v-for="(keyword, index) in hotKeywords"
            :key="keyword"
            :type="getHotTagType(index)"
            effect="plain"
            size="large"
            class="hot-tag"
          >
            {{ index + 1 }}. {{ keyword }}
          </el-tag>
        </div>
        <div v-else class="empty-state">
          暂无热门搜索
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon><Medal /></el-icon>
            最近匹配成功
          </h2>
          <el-button text type="primary" @click="router.push('/found')">查看全部 &rarr;</el-button>
        </div>
        <div v-if="successCases.length > 0" class="card-grid">
          <el-card
            v-for="item in successCases"
            :key="item.record.id"
            class="item-card success-card"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-tag type="success">匹配成功</el-tag>
                </span>
                <span class="card-time">
                  {{ formatTime(item.record.updateTime) }}
                </span>
              </div>
            </template>
            <div class="match-detail">
              <div class="match-item">
                <div class="item-label">失物</div>
                <div class="item-name">{{ item.lostItem?.itemName }}</div>
                <div class="item-location">丢失于 {{ item.lostItem?.location }}</div>
              </div>
              <div class="match-arrow">
                <el-icon><RefreshRight /></el-icon>
              </div>
              <div class="match-item">
                <div class="item-label">拾物</div>
                <div class="item-name">{{ item.foundItem?.itemName }}</div>
                <div class="item-location">捡到于 {{ item.foundItem?.location }}</div>
              </div>
            </div>
            <div class="match-score">
              <el-progress
              :percentage="Math.round(item.record.matchScore * 100)"
              :color="getScoreColor(item.record.matchScore)"
              :stroke-width="8"
            />
            </div>
          </el-card>
        </div>
        <div v-else class="empty-state">
          暂无匹配成功的案例
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { hotApi, matchApi } from '@/api'

const router = useRouter()

const hotKeywords = ref([])
const successCases = ref([])

onMounted(async () => {
  await Promise.all([
    loadHotKeywords(),
    loadSuccessCases()
  ])
})

async function loadHotKeywords() {
  try {
    const res = await hotApi.getTopKeywords(10)
    hotKeywords.value = res.data || []
  } catch (e) {
    console.error('获取热门搜索失败', e)
  }
}

async function loadSuccessCases() {
  try {
    const res = await matchApi.successCases(6)
    successCases.value = res.data || []
  } catch (e) {
    console.error('获取成功案例失败', e)
  }
}

function getHotTagType(index) {
  const types = ['danger', 'warning', 'success', 'info']
  return types[index % types.length]
}

function getScoreColor(score) {
  const s = parseFloat(score)
  if (s >= 0.95) return '#67C23A'
  if (s >= 0.9) return '#409EFF'
  return '#E6A23C'
}

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.home-page {
  min-height: 100%;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px;
  text-align: center;
  color: #fff;
}

.hero-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hot-tag {
  cursor: pointer;
  padding: 8px 16px;
}

.success-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-time {
  color: #909399;
  font-size: 13px;
}

.match-detail {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.match-item {
  flex: 1;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.item-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.item-location {
  font-size: 13px;
  color: #606266;
}

.match-arrow {
  font-size: 24px;
  color: #409EFF;
}

.match-score {
  margin-top: 12px;
}
</style>
