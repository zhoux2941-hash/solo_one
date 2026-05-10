<template>
  <div class="personal-stats">
    <el-row :gutter="20" class="summary-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orange">
              <el-icon><Coffee /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ personalSummary?.totalSpent || 0 }} 元</p>
              <p class="stat-label">累计消费</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon green">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ personalSummary?.totalSaved || 0 }} 元</p>
              <p class="stat-label">累计节省</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon blue">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ personalSummary?.totalParticipated || 0 }} 次</p>
              <p class="stat-label">参与拼单</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon purple">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ personalSummary?.totalInitiated || 0 }} 次</p>
              <p class="stat-label">发起拼单</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>近6个月参与次数</span>
          </template>
          <div ref="participateChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>近6个月贡献金额</span>
          </template>
          <div ref="amountChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>发起 vs 参与统计</span>
          </template>
          <div ref="compareChartRef" class="chart-large"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Coffee, Wallet, User, Star } from '@element-plus/icons-vue'
import { statsApi } from '../api'

const props = defineProps({
  user: Object
})

const personalSummary = ref(null)
const monthlyStats = ref([])
const participateChartRef = ref(null)
const amountChartRef = ref(null)
const compareChartRef = ref(null)

let participateChart = null
let amountChart = null
let compareChart = null

const loadData = async () => {
  if (!props.user) return
  
  try {
    personalSummary.value = await statsApi.getPersonalSummary(props.user.userId, props.user.name)
    monthlyStats.value = await statsApi.getUserMonthlyStats(props.user.userId, 6)
    
    await nextTick()
    initCharts()
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

const initCharts = () => {
  const months = monthlyStats.value.map(item => item.month)
  const participateCounts = monthlyStats.value.map(item => item.participateCount)
  const initiateCounts = monthlyStats.value.map(item => item.initiateCount)
  const amounts = monthlyStats.value.map(item => parseFloat(item.finalContribution) || 0)

  if (participateChartRef.value) {
    participateChart = echarts.init(participateChartRef.value)
    participateChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [{
        data: participateCounts,
        type: 'bar',
        itemStyle: { color: '#667eea' },
        barWidth: '50%'
      }]
    })
  }

  if (amountChartRef.value) {
    amountChart = echarts.init(amountChartRef.value)
    amountChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [{
        data: amounts,
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(102, 126, 234, 0.3)' },
        lineStyle: { color: '#667eea' },
        itemStyle: { color: '#667eea' }
      }]
    })
  }

  if (compareChartRef.value) {
    compareChart = echarts.init(compareChartRef.value)
    compareChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['参与次数', '发起次数'] },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [
        {
          name: '参与次数',
          type: 'bar',
          data: participateCounts,
          itemStyle: { color: '#667eea' }
        },
        {
          name: '发起次数',
          type: 'bar',
          data: initiateCounts,
          itemStyle: { color: '#f56c6c' }
        }
      ]
    })
  }
}

onMounted(() => {
  if (props.user) {
    loadData()
  }
})

watch(() => props.user, (newUser) => {
  if (newUser) {
    loadData()
  }
})
</script>

<style scoped>
.summary-cards {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.blue {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #666;
}

.stat-info .stat-value {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}

.stat-info .stat-label {
  margin: 5px 0 0 0;
  font-size: 13px;
  color: #909399;
}

.chart {
  height: 300px;
}

.chart-large {
  height: 400px;
}
</style>
