<template>
  <div>
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-icon :size="40" style="color: #409eff"><Box /></el-icon>
          <div class="stat-value">{{ beehiveCount }}</div>
          <div class="stat-label">蜂箱数量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-icon :size="40" style="color: #67c23a"><Edit /></el-icon>
          <div class="stat-value">{{ recordCount }}</div>
          <div class="stat-label">今日记录</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-icon :size="40" style="color: #e6a23c"><DocumentChecked /></el-icon>
          <div class="stat-value">{{ avgHealthScore }}</div>
          <div class="stat-label">平均健康分</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-icon :size="40" style="color: #f56c6c"><Sunny /></el-icon>
          <div class="stat-value">{{ bloomingCount }}</div>
          <div class="stat-label">花期预测中</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>蜂箱健康状态</span>
            </div>
          </template>
          <el-table :data="healthScores" stripe style="width: 100%">
            <el-table-column prop="hiveNumber" label="蜂箱编号" width="120" />
            <el-table-column prop="overallScore" label="健康评分" width="120">
              <template #default="{ row }">
                <el-tag :type="getHealthTagType(row.overallScore)" size="large">
                  {{ row.overallScore }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="level" label="等级" width="100" />
            <el-table-column prop="recommendation" label="建议" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>花期预测</span>
            </div>
          </template>
          <el-table :data="bloomingPredictions" stripe style="width: 100%">
            <el-table-column prop="nectarSourceName" label="蜜源植物" width="100" />
            <el-table-column prop="season" label="季节" width="100" />
            <el-table-column label="进度" width="180">
              <template #default="{ row }">
                <el-progress :percentage="Math.round(row.progress)" :status="row.status === '已开花' ? 'success' : ''" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <span :class="['blooming-status', row.status === '已开花' ? 'status-blooming' : 'status-predicting']">
                  {{ row.status }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="predictedStartDate" label="预测开花日" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近活动趋势</span>
            </div>
          </template>
          <div ref="chartRef" style="width: 100%; height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getBeehives } from '@/api/beehive'
import { getAllHealthScores } from '@/api/health'
import { getAllBloomingPredictions } from '@/api/blooming'
import { getRecordsByBeehive } from '@/api/record'

const beehiveCount = ref(0)
const recordCount = ref(0)
const avgHealthScore = ref(0)
const bloomingCount = ref(0)
const healthScores = ref([])
const bloomingPredictions = ref([])
const chartRef = ref(null)
let chart = null

function getHealthTagType(score) {
  if (score >= 80) return 'success'
  if (score >= 60) return 'primary'
  if (score >= 40) return 'warning'
  return 'danger'
}

async function loadData() {
  try {
    const beehives = await getBeehives()
    beehiveCount.value = beehives.length

    const health = await getAllHealthScores()
    healthScores.value = health
    if (health.length > 0) {
      const avg = health.reduce((sum, h) => sum + h.overallScore, 0) / health.length
      avgHealthScore.value = Math.round(avg)
    }

    const blooming = await getAllBloomingPredictions()
    bloomingPredictions.value = blooming
    bloomingCount.value = blooming.filter(b => b.status === '预测中').length

    if (beehives.length > 0) {
      loadChartData(beehives)
    }
  } catch (error) {
    console.error('加载数据失败', error)
  }
}

async function loadChartData(beehives) {
  const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']
  const series = []
  
  for (let i = 0; i < Math.min(beehives.length, 5); i++) {
    const records = await getRecordsByBeehive(beehives[i].id)
    const last10 = records.slice(0, 10).reverse()
    series.push({
      name: beehives[i].hiveNumber,
      type: 'line',
      data: last10.map(r => r.activityLevel),
      smooth: true,
      lineStyle: { color: colors[i] },
      itemStyle: { color: colors[i] }
    })
  }

  await nextTick()
  renderChart(series)
}

function renderChart(series) {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: series.map(s => s.name) },
    xAxis: {
      type: 'category',
      data: series[0]?.data?.map((_, i) => `第${i + 1}天`) || []
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      name: '活动强度'
    },
    series
  })

  window.addEventListener('resize', () => chart?.resize())
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin: 10px 0;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>
