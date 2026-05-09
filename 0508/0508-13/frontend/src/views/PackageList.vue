<template>
  <div>
    <h1 class="page-title">包裹列表</h1>
    
    <div class="search-bar">
      <el-input
        v-model="searchNo"
        placeholder="输入包裹单号搜索"
        clearable
        style="width: 300px"
      >
        <template #append>
          <el-button @click="searchPackage">搜索</el-button>
        </template>
      </el-input>
      <el-button type="primary" @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-table 
      :data="packages" 
      style="width: 100%" 
      border
      :row-class-name="getTableRowClassName"
    >
      <el-table-column label="状态" width="60">
        <template #default="scope">
          <el-badge 
            v-if="anomalyPackageIds.has(scope.row.packageId)" 
            is-dot 
            type="danger" 
            class="anomaly-dot"
          >
            <el-icon color="#f56c6c"><Warning /></el-icon>
          </el-badge>
        </template>
      </el-table-column>
      <el-table-column prop="packageNo" label="包裹单号" width="220">
        <template #default="scope">
          <span :class="{ 'anomaly-package': anomalyPackageIds.has(scope.row.packageId) }">
            {{ scope.row.packageNo }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="sender" label="发件人" width="120" />
      <el-table-column prop="senderCity" label="出发城市" width="100" />
      <el-table-column prop="receiver" label="收件人" width="120" />
      <el-table-column prop="receiverCity" label="目的城市" width="100" />
      <el-table-column prop="currentStatusDescription" label="当前状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.currentStatus)">
            {{ scope.row.currentStatusDescription }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="异常标记" width="100">
        <template #default="scope">
          <el-tag 
            v-if="anomalyPackageIds.has(scope.row.packageId)" 
            type="danger" 
            size="small"
          >
            ⚠️ 异常
          </el-tag>
          <span v-else style="color: #67c23a;">正常</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="viewTrack(scope.row)">
            轨迹
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { packageApi, anomalyApi } from '../api'
import { Refresh, Warning } from '@element-plus/icons-vue'

const router = useRouter()
const packages = ref([])
const searchNo = ref('')
const anomalyPackageIds = ref(new Set())

const loadData = async () => {
  await Promise.all([
    loadPackages(),
    loadAnomalies()
  ])
}

const loadPackages = async () => {
  try {
    const data = await packageApi.getAll()
    packages.value = data
  } catch (error) {
    console.error('加载包裹列表失败:', error)
  }
}

const loadAnomalies = async () => {
  try {
    const anomalies = await anomalyApi.getAnomalyList()
    anomalyPackageIds.value = new Set(anomalies.map(a => a.packageId))
  } catch (error) {
    console.error('加载异常数据失败:', error)
  }
}

const searchPackage = async () => {
  if (!searchNo.value) {
    await loadData()
    return
  }
  
  try {
    const data = await packageApi.getByNo(searchNo.value)
    packages.value = [data]
  } catch (error) {
    packages.value = []
  }
}

const getTableRowClassName = ({ row }) => {
  if (anomalyPackageIds.value.has(row.packageId)) {
    return 'anomaly-row'
  }
  return ''
}

const getStatusTagType = (status) => {
  const types = {
    'PICKUP': 'success',
    'IN_TRANSIT': 'primary',
    'DISPATCH': 'warning',
    'SIGNED': 'danger'
  }
  return types[status] || 'info'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const viewTrack = (row) => {
  router.push(`/packages/${row.packageId}`)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.anomaly-package {
  font-weight: bold;
  color: #f56c6c;
}

:deep(.anomaly-row) {
  background-color: #fef0f0;
}

:deep(.anomaly-row td) {
  background-color: inherit;
}

.anomaly-dot {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
