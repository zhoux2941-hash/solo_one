<template>
  <div class="page-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="5">
        <div class="stat-card">
          <div class="stat-number">{{ stats.totalRecords }}</div>
          <div class="stat-label">钓鱼记录</div>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="stat-card blue">
          <div class="stat-number">{{ stats.totalFish }}</div>
          <div class="stat-label">总钓获量</div>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="stat-card green">
          <div class="stat-number">{{ stats.totalReleased }}</div>
          <div class="stat-label">🌱 放流数量</div>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="stat-card orange">
          <div class="stat-number">{{ stats.speciesCount }}</div>
          <div class="stat-label">鱼种种类</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card eco">
          <div class="stat-number">{{ stats.ecoPoints }}</div>
          <div class="stat-label">🌍 生态积分</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card">
          <h3 class="card-title">最近钓鱼记录</h3>
          <el-table :data="recentRecords" style="width: 100%">
            <el-table-column prop="fishDate" label="日期" width="120">
              <template #default="scope">
                {{ formatDate(scope.row.fishDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="fishSpecies.name" label="鱼种" width="100" />
            <el-table-column prop="lure.model" label="拟饵" width="120" />
            <el-table-column prop="lure.color" label="颜色" width="100" />
            <el-table-column prop="catchCount" label="数量" width="80" />
            <el-table-column prop="waterTemp" label="水温(°C)" width="100" />
          </el-table>
          <el-empty v-if="recentRecords.length === 0" description="暂无记录" />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <h3 class="card-title">系统功能</h3>
          <el-row :gutter="20">
            <el-col :span="12" class="mb-20">
              <div class="feature-card" @click="$router.push('/record')">
                <el-icon size="40"><Edit /></el-icon>
                <span>记录钓鱼</span>
              </div>
            </el-col>
            <el-col :span="12" class="mb-20">
              <div class="feature-card" @click="$router.push('/recommend')">
                <el-icon size="40"><Star /></el-icon>
                <span>拟饵推荐</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="feature-card" @click="$router.push('/heatmap')">
                <el-icon size="40"><Histogram /></el-icon>
                <span>鱼种热力图</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="feature-card" @click="$router.push('/spots')">
                <el-icon size="40"><LocationFilled /></el-icon>
                <span>钓点地图</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Star, Histogram, LocationFilled } from '@element-plus/icons-vue'
import { getRecordsByUser } from '@/api/fishing'

const recentRecords = ref([])
const stats = reactive({
  totalRecords: 0,
  totalFish: 0,
  totalReleased: 0,
  ecoPoints: 0,
  speciesCount: 0,
  spotsCount: 0
})

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loadRecords = async () => {
  try {
    const res = await getRecordsByUser(1)
    recentRecords.value = res.data.slice(0, 10)
    stats.totalRecords = res.data.length
    stats.totalFish = res.data.reduce((sum, item) => sum + (item.catchCount || 0), 0)
    stats.totalReleased = res.data.reduce((sum, item) => sum + (item.releaseCount || 0), 0)
    stats.ecoPoints = res.data.reduce((sum, item) => sum + (item.ecoPointsEarned || 0), 0)
    const uniqueSpecies = new Set(res.data.map(item => item.fishSpeciesId))
    stats.speciesCount = uniqueSpecies.size
  } catch (error) {
    console.error('加载记录失败:', error)
  }
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.feature-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.feature-card span {
  display: block;
  margin-top: 12px;
  font-size: 16px;
  font-weight: 500;
}
</style>
