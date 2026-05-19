<template>
  <div class="statistics">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>运维工单统计报表</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="loadStatistics"
            style="width: 380px"
          />
        </div>
      </template>

      <el-row :gutter="20" style="margin-bottom: 30px">
        <el-col :span="6">
          <div class="stat-card total-card">
            <div class="stat-label">总工单数</div>
            <div class="stat-value">{{ overview.total }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card completed-card">
            <div class="stat-label">已完成</div>
            <div class="stat-value">{{ overview.completed }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card pending-card">
            <div class="stat-label">待处理</div>
            <div class="stat-value">{{ overview.pending }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card rate-card">
            <div class="stat-label">完成率</div>
            <div class="stat-value">{{ overview.completionRate }}%</div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="16">
          <el-card shadow="hover">
            <template #header>
              <span>每日完成趋势</span>
            </template>
            <div class="chart-container">
              <table class="trend-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>总工单</th>
                    <th>已完成</th>
                    <th>进行中</th>
                    <th>完成率</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in dailyStats" :key="item.date">
                    <td>{{ formatDate(item.date) }}</td>
                    <td>{{ item.totalCount }}</td>
                    <td>{{ item.completedCount }}</td>
                    <td>{{ item.inProgressCount }}</td>
                    <td>
                      <el-progress 
                        :percentage="Math.round(item.completionRate * 10) / 10" 
                        :stroke-width="8"
                        :color="getProgressColor(item.completionRate)"
                      />
                    </td>
                  </tr>
                  <tr v-if="dailyStats.length === 0">
                    <td colspan="5" style="text-align: center; color: #999">
                      暂无数据
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="hover" style="margin-bottom: 20px">
            <template #header>
              <span>运维人员排名</span>
            </template>
            <div class="rank-list">
              <div v-for="(item, index) in assigneeRanking" :key="item.assigneeId" class="rank-item">
                <div class="rank-number" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
                <div class="rank-info">
                  <div class="rank-name">{{ item.assigneeName }}</div>
                  <div class="rank-detail">
                    完成: {{ item.completedCount }}/{{ item.totalCount }}
                  </div>
                </div>
                <div class="rank-rate">
                  {{ Math.round(item.completionRate * 10) / 10 }}%
                </div>
              </div>
              <div v-if="assigneeRanking.length === 0" style="text-align: center; color: #999; padding: 20px">
                暂无数据
              </div>
            </div>
          </el-card>

          <el-card shadow="hover">
            <template #header>
              <span>故障类型分布</span>
            </template>
            <div class="type-list">
              <div v-for="item in todayStats.byFaultType" :key="item.faultType" class="type-item">
                <span class="type-name">{{ item.faultType || '未分类' }}</span>
                <span class="type-count">{{ item.totalCount }}单</span>
              </div>
              <div v-if="todayStats.byFaultType.length === 0" style="text-align: center; color: #999; padding: 20px">
                暂无数据
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header>
              <span>故障设备TOP10</span>
            </template>
            <el-table :data="todayStats.byDevice" style="width: 100%">
              <el-table-column prop="deviceName" label="设备名称" width="200" />
              <el-table-column prop="totalCount" label="工单总数" width="120" align="center" />
              <el-table-column prop="completedCount" label="已完成" width="120" align="center" />
              <el-table-column label="完成率" width="200">
                <template #default="scope">
                  <el-progress 
                    :percentage="Math.round(scope.row.completionRate * 10) / 10" 
                    :stroke-width="8"
                  />
                </template>
              </el-table-column>
            </el-table>
            <div v-if="todayStats.byDevice.length === 0" style="text-align: center; color: #999; padding: 20px">
              暂无数据
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { statisticsApi } from '../api'

const today = new Date()
const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

const dateRange = ref([oneWeekAgo, today])

const overview = reactive({
  total: 0,
  completed: 0,
  pending: 0,
  inProgress: 0,
  completionRate: 0
})

const todayStats = reactive({
  byAssignee: [],
  byFaultType: [],
  byPriority: [],
  byDevice: []
})

const dailyStats = ref([])
const assigneeRanking = ref([])

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const getProgressColor = (rate) => {
  if (rate >= 80) return '#67c23a'
  if (rate >= 50) return '#e6a23c'
  return '#f56c6c'
}

const loadStatistics = async () => {
  try {
    const [startDate, endDate] = dateRange.value
    const startStr = formatDateParam(startDate)
    const endStr = formatDateParam(endDate)
    
    const [rangeData, todayData, assigneeData] = await Promise.all([
      statisticsApi.getRange(startStr, endStr),
      statisticsApi.getToday(),
      statisticsApi.getAllAssignees(startStr, endStr)
    ])
    
    dailyStats.value = rangeData
    assigneeRanking.value = assigneeData
    
    todayStats.byAssignee = todayData.byAssignee || []
    todayStats.byFaultType = todayData.byFaultType || []
    todayStats.byPriority = todayData.byPriority || []
    todayStats.byDevice = todayData.byDevice || []
    
    calculateOverview(rangeData)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const formatDateParam = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const calculateOverview = (data) => {
  let total = 0
  let completed = 0
  let pending = 0
  let inProgress = 0
  
  data.forEach(item => {
    total += item.totalCount || 0
    completed += item.completedCount || 0
    pending += item.pendingCount || 0
    inProgress += item.inProgressCount || 0
  })
  
  overview.total = total
  overview.completed = completed
  overview.pending = pending
  overview.inProgress = inProgress
  overview.completionRate = total > 0 ? Math.round((completed / total * 100) * 100) / 100 : 0
}

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.statistics {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  padding: 20px;
  border-radius: 8px;
  color: white;
  text-align: center;
}

.total-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.completed-card {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.pending-card {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.rate-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.chart-container {
  max-height: 400px;
  overflow-y: auto;
}

.trend-table {
  width: 100%;
  border-collapse: collapse;
}

.trend-table th,
.trend-table td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.trend-table th {
  background: #f5f7fa;
  font-weight: 500;
}

.rank-list {
  max-height: 300px;
  overflow-y: auto;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.rank-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  margin-right: 12px;
  font-size: 14px;
}

.rank-1 {
  background: #f7ba2a;
}

.rank-2 {
  background: #909399;
}

.rank-3 {
  background: #e6a23c;
}

.rank-number:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #c0c4cc;
}

.rank-info {
  flex: 1;
}

.rank-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.rank-detail {
  font-size: 12px;
  color: #999;
}

.rank-rate {
  font-size: 16px;
  font-weight: bold;
  color: #67c23a;
}

.type-list {
  max-height: 200px;
  overflow-y: auto;
}

.type-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.type-name {
  color: #333;
}

.type-count {
  color: #409eff;
  font-weight: bold;
}
</style>
