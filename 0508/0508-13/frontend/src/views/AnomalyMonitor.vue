<template>
  <div>
    <h1 class="page-title">
      <span>异常监控</span>
      <el-badge 
        v-if="anomalyCount > 0" 
        :value="anomalyCount" 
        type="danger" 
        class="anomaly-badge"
      >
      </el-badge>
    </h1>

    <div class="search-bar">
      <el-switch
        v-model="autoRefresh"
        active-text="自动刷新"
        inactive-text="手动刷新"
      />
      <el-button type="primary" @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新检测
      </el-button>
      <el-button type="warning" @click="forceDetect">
        <el-icon><Warning /></el-icon>
        强制重新检测
      </el-button>
    </div>

    <div v-if="loading" class="chart-container" style="text-align: center; padding: 50px;">
      <el-loading text="正在执行异常检测..." />
    </div>

    <div v-else>
      <div class="card-container">
        <div class="stat-card">
          <div class="stat-card-title">异常包裹数</div>
          <div class="stat-card-value" :style="{ color: anomalyCount > 0 ? '#f56c6c' : '#67c23a' }">
            {{ anomalyCount }}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">总包裹数</div>
          <div class="stat-card-value">{{ totalPackages }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">异常率</div>
          <div class="stat-card-value" :style="{ color: anomalyRate > 5 ? '#f56c6c' : '#409eff' }">
            {{ anomalyRate }}%
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">最后检测时间</div>
          <div class="stat-card-value" style="font-size: 18px;">{{ lastDetectedAt }}</div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-title">📊 线路统计（均值 ± 2×标准差）</div>
        <el-table :data="routeStatistics" border>
          <el-table-column label="线路" width="200">
            <template #default="scope">
              <el-tag type="primary" size="small">{{ scope.row.fromCity }}</el-tag>
              <span style="margin: 0 5px;">→</span>
              <el-tag type="success" size="small">{{ scope.row.toCity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalPackages" label="样本数" width="100" />
          <el-table-column prop="meanDurationHours" label="均值(小时)" width="120" />
          <el-table-column prop="standardDeviation" label="标准差" width="120" />
          <el-table-column prop="threshold" label="异常阈值" width="120">
            <template #default="scope">
              <el-tag type="danger" size="small">{{ scope.row.threshold }}h</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="范围" width="200">
            <template #default="scope">
              {{ scope.row.minDuration }} - {{ scope.row.maxDuration }} 小时
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="anomalies.length === 0" class="chart-container">
        <el-empty description="暂无异常包裹，所有线路运行正常 ✅" />
      </div>

      <div v-else class="chart-container">
        <div class="chart-title">
          ⚠️ 异常包裹列表
          <el-tag type="danger" size="large" style="margin-left: 10px;">
            {{ anomalies.length }} 个异常
          </el-tag>
        </div>

        <el-table 
          :data="anomalies" 
          border 
          :row-class-name="getRowClassName"
        >
          <el-table-column type="index" label="排名" width="60" />
          <el-table-column prop="packageNo" label="包裹单号" width="200">
            <template #default="scope">
              <span style="font-weight: bold; color: #f56c6c;">{{ scope.row.packageNo }}</span>
            </template>
          </el-table-column>
          <el-table-column label="线路" width="180">
            <template #default="scope">
              <el-tag type="primary" size="small">{{ scope.row.senderCity }}</el-tag>
              <span style="margin: 0 5px;">→</span>
              <el-tag type="success" size="small">{{ scope.row.receiverCity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="当前时长" width="120">
            <template #default="scope">
              <el-tag type="danger" size="small">{{ scope.row.currentDurationHours }}h</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="均值/阈值" width="150">
            <template #default="scope">
              <span>{{ scope.row.meanDurationHours }}h / </span>
              <span style="color: #f56c6c; font-weight: bold;">{{ scope.row.threshold }}h</span>
            </template>
          </el-table-column>
          <el-table-column prop="zScore" label="Z分数" width="100">
            <template #default="scope">
              <el-tag :type="getZScoreTagType(scope.row.zScore)" size="small">
                {{ scope.row.zScore }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="疑似卡住节点" min-width="250">
            <template #default="scope">
              <template v-if="scope.row.suspectedStuckNodes && scope.row.suspectedStuckNodes.length > 0">
                <div v-for="(node, idx) in scope.row.suspectedStuckNodes" :key="idx" style="margin-bottom: 5px;">
                  <el-tag :type="getNodeTagType(node.probability)" size="small">
                    {{ node.centerName }}
                    <span style="margin-left: 5px;">({{ node.stuckHours }}h, {{ Math.round(node.probability * 100) }}%)</span>
                  </el-tag>
                </div>
              </template>
              <span v-else style="color: #909399;">待确认</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button type="primary" link @click="viewTrack(scope.row.packageId)">
                轨迹详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-collapse v-if="anomalies.length > 0" style="margin-top: 20px;">
          <el-collapse-item title="📋 异常原因详情" name="1">
            <el-table :data="anomalies" border size="small">
              <el-table-column prop="packageNo" label="包裹单号" width="200" />
              <el-table-column prop="anomalyReason" label="异常原因分析" />
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { anomalyApi } from '../api'
import { Refresh, Warning } from '@element-plus/icons-vue'

const router = useRouter()

const loading = ref(false)
const autoRefresh = ref(true)
const anomalies = ref([])
const routeStatistics = ref([])
const anomalyCount = ref(0)
const totalPackages = ref(0)
const anomalyRate = ref(0)
const lastDetectedAt = ref('-')

let autoRefreshInterval = null

const loadData = async () => {
  loading.value = true
  try {
    const data = await anomalyApi.getAnomalyList()
    anomalies.value = data || []
    anomalyCount.value = anomalies.value.length
    
    try {
      const stats = await anomalyApi.getRouteStatistics()
      routeStatistics.value = stats || []
    } catch (e) {
      console.error('获取线路统计失败:', e)
    }
    
    lastDetectedAt.value = new Date().toLocaleString('zh-CN')
  } catch (error) {
    console.error('加载异常数据失败:', error)
  } finally {
    loading.value = false
  }
}

const forceDetect = async () => {
  loading.value = true
  try {
    const result = await anomalyApi.forceDetect()
    anomalies.value = result.anomalies || []
    routeStatistics.value = result.routeStatistics || []
    anomalyCount.value = result.anomalyCount
    totalPackages.value = result.totalPackages
    anomalyRate.value = result.anomalyRate
    lastDetectedAt.value = result.analyzedAt || new Date().toLocaleString('zh-CN')
    
    showNotification(result.anomalyCount)
  } catch (error) {
    console.error('强制检测失败:', error)
  } finally {
    loading.value = false
  }
}

const showNotification = (count) => {
  if (count > 0) {
    ElNotification({
      title: '⚠️ 异常检测告警',
      message: `检测到 ${count} 个异常包裹需要关注！`,
      type: 'warning',
      duration: 0,
      position: 'top-right'
    })
  } else {
    ElNotification({
      title: '✅ 检测完成',
      message: '所有线路运行正常，无异常包裹',
      type: 'success',
      duration: 3000,
      position: 'top-right'
    })
  }
}

const getRowClassName = ({ row }) => {
  if (row.zScore > 3) return 'anomaly-row-severe'
  if (row.zScore > 2.5) return 'anomaly-row-medium'
  return 'anomaly-row'
}

const getZScoreTagType = (zScore) => {
  if (zScore > 3) return 'danger'
  if (zScore > 2.5) return 'warning'
  return 'primary'
}

const getNodeTagType = (probability) => {
  if (probability > 0.7) return 'danger'
  if (probability > 0.4) return 'warning'
  return 'info'
}

const viewTrack = (packageId) => {
  router.push(`/packages/${packageId}`)
}

const startAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
  autoRefreshInterval = setInterval(async () => {
    if (autoRefresh.value) {
      const oldCount = anomalyCount.value
      await loadData()
      if (anomalyCount.value > oldCount) {
        showNotification(anomalyCount.value)
      }
    }
  }, 60000)
}

watch(autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh()
  } else if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
})

onMounted(async () => {
  await loadData()
  startAutoRefresh()
})

onUnmounted(() => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
})
</script>

<style scoped>
.anomaly-badge {
  margin-left: 15px;
}

:deep(.anomaly-row) {
  background-color: #fef0f0;
}

:deep(.anomaly-row-medium) {
  background-color: #fdf6ec;
}

:deep(.anomaly-row-severe) {
  background-color: #fef0f0;
}

:deep(.anomaly-row td) {
  background-color: inherit;
}

:deep(.anomaly-row-medium td) {
  background-color: inherit;
}

:deep(.anomaly-row-severe td) {
  background-color: inherit;
}
</style>
