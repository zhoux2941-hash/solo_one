<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="6" v-for="score in healthScores" :key="score.beehiveId">
        <el-card class="health-card" :body-style="{ padding: '20px' }">
          <div class="hive-number">{{ score.hiveNumber }}</div>
          <div class="health-score" :class="getHealthClass(score.overallScore)">
            {{ score.overallScore }}
          </div>
          <el-tag :type="getHealthTagType(score.overallScore)" size="large">
            {{ score.level }}
          </el-tag>
          <div class="recommendation">{{ score.recommendation }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12" v-for="score in healthScores" :key="score.beehiveId + '-detail'">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ score.hiveNumber }} - 详细评分</span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="综合评分">
              <el-progress :percentage="score.overallScore" :color="getProgressColor(score.overallScore)" />
            </el-descriptions-item>
            <el-descriptions-item label="温度稳定性">
              <el-progress :percentage="Math.round(score.temperatureStabilityScore)" :color="getProgressColor(score.temperatureStabilityScore)" />
              <div class="score-note">权重：40% | 适宜：早晨30-38°C，晚间25-35°C</div>
            </el-descriptions-item>
            <el-descriptions-item label="湿度适宜性">
              <el-progress :percentage="Math.round(score.humidityAppropriatenessScore)" :color="getProgressColor(score.humidityAppropriatenessScore)" />
              <div class="score-note">权重：30% | 适宜：50-80%，临界<30%或>90%</div>
            </el-descriptions-item>
            <el-descriptions-item label="活动趋势">
              <el-progress :percentage="Math.round(score.activityTrendScore)" :color="getProgressColor(score.activityTrendScore)" />
              <div class="score-note">权重：30% | 活动强度等级1-10</div>
            </el-descriptions-item>
            <el-descriptions-item label="问题预警">
              <el-tag v-if="score.issues?.length === 0" type="success">无</el-tag>
              <div v-else>
                <el-tag 
                  v-for="(issue, index) in score.issues" 
                  :key="index" 
                  :type="getIssueTagType(issue)"
                  style="margin-right: 8px; margin-bottom: 8px"
                >
                  {{ issue }}
                </el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="计算日期">
              {{ score.calculationDate }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>健康评分雷达图</span>
            </div>
          </template>
          <div ref="radarRef" style="width: 100%; height: 400px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getAllHealthScores } from '@/api/health'

const healthScores = ref([])
const radarRef = ref(null)
let chart = null

function getHealthClass(score) {
  if (score >= 80) return 'health-excellent'
  if (score >= 60) return 'health-good'
  if (score >= 40) return 'health-normal'
  return 'health-warning'
}

function getHealthTagType(score) {
  if (score >= 80) return 'success'
  if (score >= 60) return 'primary'
  if (score >= 40) return 'warning'
  return 'danger'
}

function getProgressColor(score) {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#409eff'
  if (score >= 40) return '#e6a23c'
  return '#f56c6c'
}

function getIssueTagType(issue) {
  if (issue.includes('建议') || issue.includes('基本适宜') || issue.includes('数据不足')) {
    return 'info'
  }
  if (issue.includes('低') || issue.includes('高') || issue.includes('大') || issue.includes('偏离') || issue.includes('下降')) {
    return 'warning'
  }
  if (issue.includes('严重') || issue.includes('需要关注')) {
    return 'danger'
  }
  return 'info'
}

async function loadData() {
  try {
    healthScores.value = await getAllHealthScores()
    await nextTick()
    renderRadarChart()
  } catch (error) {
    console.error('加载健康评分失败', error)
  }
}

function renderRadarChart() {
  if (!radarRef.value || healthScores.value.length === 0) return

  chart = echarts.init(radarRef.value)
  const indicators = [
    { name: '综合评分', max: 100 },
    { name: '温度稳定性', max: 100 },
    { name: '湿度适宜性', max: 100 },
    { name: '活动趋势', max: 100 }
  ]

  const series = [{
    type: 'radar',
    data: healthScores.value.map(score => ({
      name: score.hiveNumber,
      value: [
        score.overallScore,
        score.temperatureStabilityScore,
        score.humidityAppropriatenessScore,
        score.activityTrendScore
      ]
    }))
  }]

  chart.setOption({
    tooltip: {},
    legend: {
      data: healthScores.value.map(s => s.hiveNumber)
    },
    radar: {
      indicator: indicators,
      splitArea: {
        show: true
      }
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
.health-card {
  text-align: center;
  margin-bottom: 20px;
}

.hive-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.health-score {
  font-size: 48px;
  font-weight: bold;
  margin: 10px 0;
}

.health-excellent {
  color: #67c23a;
}

.health-good {
  color: #409eff;
}

.health-normal {
  color: #e6a23c;
}

.health-warning {
  color: #f56c6c;
}

.recommendation {
  margin-top: 15px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.score-note {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
