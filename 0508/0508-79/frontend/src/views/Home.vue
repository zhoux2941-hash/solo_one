<template>
  <div class="home-page">
    <div class="welcome-section card">
      <h2>欢迎回来，{{ user?.nickname || user?.username }}！</h2>
      <p>开始交换你的盲盒，发现更多宝藏</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card">
          <div class="flex space-between items-center mb-20">
            <h3 class="section-title">热门盲盒系列</h3>
            <el-tag type="info" effect="plain">Redis 实时统计</el-tag>
          </div>
          <el-empty v-if="!hotSeries.length" description="暂无数据" />
          <el-row v-else :gutter="10">
            <el-col :span="12" v-for="(score, series, index) in hotSeries" :key="series">
              <div class="hot-item">
                <span class="rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
                <span class="series-name">{{ series }}</span>
                <span class="score">{{ Math.floor(score) }} 次浏览</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <div class="flex space-between items-center mb-20">
            <h3 class="section-title">为你推荐</h3>
            <el-tag type="success" effect="plain">基于浏览历史</el-tag>
          </div>
          <el-empty v-if="!recommendations.length" description="浏览更多盲盒后为你推荐" />
          <el-row v-else :gutter="10">
            <el-col :span="12" v-for="box in recommendations.slice(0, 4)" :key="box.id">
              <div class="rec-box">
                <div class="box-image">
                  <img v-if="box.imageUrl" :src="box.imageUrl" />
                  <span v-else>{{ box.seriesName }}</span>
                </div>
                <div class="box-info">
                  <p class="series">{{ box.seriesName }}</p>
                  <p class="style">{{ box.styleName }}</p>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
    </el-row>

    <div class="card">
      <div class="flex space-between items-center mb-20">
        <h3 class="section-title">我的浏览历史</h3>
        <el-button type="text" @click="clearHistory" :disabled="!history.length">
          清除历史
        </el-button>
      </div>
      <el-empty v-if="!history.length" description="暂无浏览记录" />
      <div v-else class="grid-4">
        <el-card v-for="box in history" :key="box.id" shadow="hover" class="box-card">
          <div class="box-image" @click="viewBox(box.id)">
            <img v-if="box.imageUrl" :src="box.imageUrl" />
            <span v-else>{{ box.seriesName }}</span>
          </div>
          <div class="box-content">
            <p class="series">{{ box.seriesName }}</p>
            <p class="style">{{ box.styleName }}</p>
            <div class="flex space-between items-center">
              <el-tag :type="box.isAvailable ? 'success' : 'info'">
                {{ box.isAvailable ? '可交换' : '已交换' }}
              </el-tag>
              <el-tag type="info">{{ box.condition }}</el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getHotSeries } from '@/api/box'
import { getBrowseHistory, getRecommendations, clearHistory as clearHistoryApi } from '@/api/history'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const hotSeries = ref({})
const history = ref([])
const recommendations = ref([])

const fetchHotSeries = async () => {
  try {
    const res = await getHotSeries(10)
    hotSeries.value = res.data
  } catch (e) {
  }
}

const fetchHistory = async () => {
  try {
    const res = await getBrowseHistory()
    history.value = res.data
  } catch (e) {
  }
}

const fetchRecommendations = async () => {
  try {
    const res = await getRecommendations()
    recommendations.value = res.data
  } catch (e) {
  }
}

const viewBox = (id) => {
  router.push({ path: '/hall', query: { boxId: id } })
}

const clearHistory = async () => {
  ElMessageBox.confirm('确定要清除浏览历史吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await clearHistoryApi()
    ElMessage.success('已清除')
    fetchHistory()
  }).catch(() => {})
}

onMounted(() => {
  fetchHotSeries()
  fetchHistory()
  fetchRecommendations()
})
</script>

<style scoped>
.home-page {
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.welcome-section h2 {
  font-size: 28px;
  margin-bottom: 8px;
}

.welcome-section p {
  opacity: 0.9;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.hot-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 10px;
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ddd;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
}

.rank-1 { background: #f56c6c; }
.rank-2 { background: #e6a23c; }
.rank-3 { background: #409eff; }

.series-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.score {
  font-size: 12px;
  color: #999;
}

.rec-box {
  cursor: pointer;
  margin-bottom: 10px;
}

.rec-box .box-image {
  height: 120px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.rec-box .box-info .series {
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.rec-box .box-info .style {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.box-card {
  cursor: pointer;
}

.box-card :deep(.el-card__body) {
  padding: 0;
}

.box-content {
  padding: 12px;
}

.box-content .series {
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.box-content .style {
  font-size: 12px;
  color: #666;
  margin: 0 0 10px 0;
}
</style>
