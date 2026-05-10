<template>
  <div class="expiring-page">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon color="#f56c6c"><Warning /></el-icon>
        有效期预警
      </h2>
      <div class="header-right">
        <el-tag type="warning" size="large">
          预警周期：30天内过期
        </el-tag>
        <el-button type="primary" @click="refreshData" style="margin-left: 10px">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="8">
        <el-card class="stat-card">
          <el-icon :size="48" color="#e6a23c"><Warning /></el-icon>
          <div class="stat-number" :style="{ color: '#e6a23c' }">{{ warningData.total }}</div>
          <div class="stat-label">近效期批次总数</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <el-icon :size="48" color="#f56c6c"><Clock /></el-icon>
          <div class="stat-number" :style="{ color: '#f56c6c' }">{{ urgentCount }}</div>
          <div class="stat-label">7天内过期（紧急）</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <el-icon :size="48" color="#409eff"><Box /></el-icon>
          <div class="stat-number">{{ warningData.batches.reduce((sum, item) => sum + (item.quantity || 0), 0) }}</div>
          <div class="stat-label">近效期库存总量</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>近效期疫苗列表</span>
          <div class="card-actions">
            <el-radio-group v-model="filterType" size="small">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="urgent">紧急（7天内）</el-radio-button>
              <el-radio-button label="warning">警告（8-30天）</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table
        v-if="filteredBatches.length > 0"
        :data="filteredBatches"
        style="width: 100%"
        :row-class-name="tableRowClassName"
        border
        default-sort="{ prop: 'daysUntilExpiry', order: 'ascending' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="vaccineName" label="疫苗名称" width="180" />
        <el-table-column prop="batchNumber" label="批号" width="150" />
        <el-table-column prop="productionDate" label="生产日期" width="120" />
        <el-table-column prop="expiryDate" label="有效期" width="120" />
        <el-table-column prop="quantity" label="库存数量" width="100" align="center" />
        <el-table-column prop="daysUntilExpiry" label="距离过期天数" width="150" align="center">
          <template #default="scope">
            <el-tag
              v-if="scope.row.daysUntilExpiry <= 7"
              type="danger"
              effect="dark"
              class="warning-badge"
            >
              <el-icon><Clock /></el-icon>
              {{ scope.row.daysUntilExpiry }} 天
            </el-tag>
            <el-tag v-else type="warning">
              <el-icon><Clock /></el-icon>
              {{ scope.row.daysUntilExpiry }} 天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="紧急程度" width="120" align="center">
          <template #default="scope">
            <el-tag
              v-if="scope.row.daysUntilExpiry <= 7"
              type="danger"
              effect="dark"
            >
              紧急
            </el-tag>
            <el-tag v-else type="warning">
              警告
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="当前没有近效期疫苗" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getExpiringBatches } from '../api/vaccine'

const warningData = ref({
  total: 0,
  batches: []
})
const filterType = ref('all')

const urgentCount = computed(() => {
  return warningData.value.batches.filter(batch => batch.daysUntilExpiry <= 7).length
})

const filteredBatches = computed(() => {
  if (filterType.value === 'urgent') {
    return warningData.value.batches.filter(batch => batch.daysUntilExpiry <= 7)
  } else if (filterType.value === 'warning') {
    return warningData.value.batches.filter(
      batch => batch.daysUntilExpiry > 7 && batch.daysUntilExpiry <= 30
    )
  }
  return warningData.value.batches
})

const fetchData = async () => {
  try {
    const data = await getExpiringBatches()
    warningData.value = data
  } catch (error) {
    console.error('获取近效期疫苗失败:', error)
  }
}

const refreshData = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

const tableRowClassName = ({ row }) => {
  if (row.daysUntilExpiry <= 7) {
    return 'expiring-row'
  }
  return ''
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.expiring-page {
  padding: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>
