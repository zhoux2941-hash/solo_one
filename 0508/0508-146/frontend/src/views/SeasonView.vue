<template>
  <div class="season-container">
    <el-card class="card">
      <template #header>
        <div class="card-header">
          <span>📊 最佳嫁接季节分析</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="form" class="search-form">
        <el-form-item label="砧木">
          <el-select v-model="form.rootstockId" placeholder="选择砧木">
            <el-option
              v-for="item in rootstocks"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="接穗">
          <el-select v-model="form.scionId" placeholder="选择接穗">
            <el-option
              v-for="item in scions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="analyze" :loading="loading">
            分析季节
          </el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="analysisData" class="analysis-result">
        <el-result
          v-if="bestMonth"
          icon="success"
          :title="`最佳嫁接月份: ${getMonthName(bestMonth)}月`"
          :sub-title="`预估成活率: ${bestRate}%`"
        />
        
        <div class="chart-container">
          <h3>月度成活率趋势</h3>
          <div class="bar-chart">
            <div
              v-for="rate in sortedRates"
              :key="rate.month"
              class="bar-item"
            >
              <div class="bar-label">{{ getMonthName(rate.month) }}</div>
              <div class="bar-wrapper">
                <div
                  class="bar"
                  :style="{ height: rate.rate + '%', background: getBarColor(rate.rate) }"
                ></div>
              </div>
              <div class="bar-value">{{ rate.rate }}%</div>
            </div>
          </div>
        </div>
        
        <div class="season-summary">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="summary-card" shadow="hover">
                <div class="summary-title">春季(3-5月)</div>
                <div class="summary-value" :style="{ color: getSeasonColor(springAvg) }">
                  {{ springAvg }}%
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="summary-card" shadow="hover">
                <div class="summary-title">夏季(6-8月)</div>
                <div class="summary-value" :style="{ color: getSeasonColor(summerAvg) }">
                  {{ summerAvg }}%
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="summary-card" shadow="hover">
                <div class="summary-title">秋季(9-11月)</div>
                <div class="summary-value" :style="{ color: getSeasonColor(autumnAvg) }">
                  {{ autumnAvg }}%
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
      
      <el-empty v-else description="请选择砧木和接穗进行季节分析" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRootstocks, getScions, getSeasonAnalysis } from '../api'

const rootstocks = ref([])
const scions = ref([])
const loading = ref(false)
const analysisData = ref(null)

const form = ref({
  rootstockId: null,
  scionId: null
})

const monthNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']

const getMonthName = (month) => monthNames[month - 1]

const sortedRates = computed(() => {
  if (!analysisData.value) return []
  
  return Object.entries(analysisData.value).map(([month, rate]) => ({
    month: parseInt(month),
    rate: parseFloat(rate) || 0
  })).sort((a, b) => a.month - b.month)
})

const bestMonth = computed(() => {
  const rates = sortedRates.value
  if (rates.length === 0) return null
  
  const sorted = [...rates].sort((a, b) => b.rate - a.rate)
  return sorted[0].rate > 0 ? sorted[0].month : null
})

const bestRate = computed(() => {
  const rates = sortedRates.value
  if (rates.length === 0) return 0
  
  const sorted = [...rates].sort((a, b) => b.rate - a.rate)
  return sorted[0].rate
})

const springAvg = computed(() => calculateSeasonAvg([3, 4, 5]))
const summerAvg = computed(() => calculateSeasonAvg([6, 7, 8]))
const autumnAvg = computed(() => calculateSeasonAvg([9, 10, 11]))

const calculateSeasonAvg = (months) => {
  if (!analysisData.value) return 0
  
  let sum = 0
  let count = 0
  
  for (const month of months) {
    const rate = analysisData.value[month]
    if (rate > 0) {
      sum += parseFloat(rate)
      count++
    }
  }
  
  return count > 0 ? Math.round(sum / count * 100) / 100 : 0
}

const getBarColor = (rate) => {
  if (rate >= 70) return '#67c23a'
  if (rate >= 50) return '#409eff'
  if (rate >= 30) return '#e6a23c'
  return '#f56c6c'
}

const getSeasonColor = (rate) => {
  if (rate >= 70) return '#67c23a'
  if (rate >= 50) return '#409eff'
  if (rate >= 30) return '#e6a23c'
  return '#909399'
}

const analyze = async () => {
  if (!form.value.rootstockId || !form.value.scionId) {
    ElMessage.warning('请选择砧木和接穗')
    return
  }
  
  loading.value = true
  try {
    const res = await getSeasonAnalysis(form.value.rootstockId, form.value.scionId)
    analysisData.value = res.data
  } catch (error) {
    ElMessage.error('分析失败，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const [rootstockRes, scionRes] = await Promise.all([
      getRootstocks(),
      getScions()
    ])
    rootstocks.value = rootstockRes.data
    scions.value = scionRes.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
})
</script>

<style scoped>
.season-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  margin-top: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.search-form {
  margin-bottom: 30px;
}

.analysis-result {
  margin-top: 20px;
}

.chart-container {
  margin: 40px 0;
  text-align: center;
}

.chart-container h3 {
  margin-bottom: 30px;
  color: #303133;
}

.bar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 250px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 60px;
}

.bar-label {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.bar-wrapper {
  width: 40px;
  height: 150px;
  display: flex;
  align-items: flex-end;
  background: #e4e7ed;
  border-radius: 4px;
}

.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s;
}

.bar:hover {
  opacity: 0.8;
}

.bar-value {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.season-summary {
  margin-top: 40px;
}

.summary-card {
  text-align: center;
}

.summary-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 10px;
}

.summary-value {
  font-size: 28px;
  font-weight: bold;
}
</style>
