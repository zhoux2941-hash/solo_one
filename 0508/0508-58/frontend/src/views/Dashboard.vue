<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h2 class="page-title">仪表盘</h2>
      <el-button type="primary" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-icon :size="48" color="#409eff"><Document /></el-icon>
          <div class="stat-number">{{ stats.totalVaccineTypes }}</div>
          <div class="stat-label">疫苗种类</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-icon :size="48" color="#67c23a"><Box /></el-icon>
          <div class="stat-number">{{ stats.totalStock }}</div>
          <div class="stat-label">总库存数量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-icon :size="48" color="#e6a23c"><Warning /></el-icon>
          <div class="stat-number warning-badge" :style="{ color: '#e6a23c' }">
            {{ stats.expiringCount }}
          </div>
          <div class="stat-label">近效期批次（30天内）</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-icon :size="48" color="#f56c6c"><Clock /></el-icon>
          <div class="stat-number" :style="{ color: '#f56c6c' }">
            {{ stats.expiringStock }}
          </div>
          <div class="stat-label">近效期库存数量</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mt-20">
      <template #header>
        <div class="card-header">
          <span>近效期疫苗预警</span>
          <el-tag type="warning">30天内过期</el-tag>
        </div>
      </template>
      <el-table
        v-if="expiringBatches.length > 0"
        :data="expiringBatches"
        style="width: 100%"
        :row-class-name="tableRowClassName"
        border
      >
        <el-table-column prop="vaccineName" label="疫苗名称" width="180" />
        <el-table-column prop="batchNumber" label="批号" width="150" />
        <el-table-column prop="productionDate" label="生产日期" width="120" />
        <el-table-column prop="expiryDate" label="有效期" width="120" />
        <el-table-column prop="quantity" label="库存数量" width="100" align="center" />
        <el-table-column label="距离过期" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.daysUntilExpiry <= 7" type="danger" effect="dark">
              {{ scope.row.daysUntilExpiry }} 天
            </el-tag>
            <el-tag v-else-if="scope.row.daysUntilExpiry <= 15" type="warning" effect="dark">
              {{ scope.row.daysUntilExpiry }} 天
            </el-tag>
            <el-tag v-else type="warning">
              {{ scope.row.daysUntilExpiry }} 天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag type="danger" effect="dark">紧急</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无近效期疫苗" />
    </el-card>

    <el-card class="mt-20">
      <template #header>
        <div class="card-header">
          <span>疫苗库存概览</span>
        </div>
      </template>
      <el-table
        :data="vaccineStock"
        style="width: 100%"
        border
      >
        <el-table-column prop="vaccineName" label="疫苗名称" width="180" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="manufacturer" label="生产厂家" width="150" />
        <el-table-column prop="totalQuantity" label="总库存" width="100" align="center" />
        <el-table-column label="批次数量" width="100" align="center">
          <template #default="scope">
            {{ scope.row.batches.length }}
          </template>
        </el-table-column>
        <el-table-column label="近效期" width="100" align="center">
          <template #default="scope">
            <el-tag
              v-if="getExpiringCount(scope.row) > 0"
              type="danger"
            >
              {{ getExpiringCount(scope.row) }} 个
            </el-tag>
            <el-tag v-else type="success">
              0 个
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getVaccineStock, getExpiringBatches } from '../api/vaccine'

const vaccineStock = ref([])
const expiringBatches = ref([])
const stats = ref({
  totalVaccineTypes: 0,
  totalStock: 0,
  expiringCount: 0,
  expiringStock: 0
})

const fetchData = async () => {
  try {
    const [stockData, expiringData] = await Promise.all([
      getVaccineStock(),
      getExpiringBatches()
    ])

    vaccineStock.value = stockData
    expiringBatches.value = expiringData.batches

    stats.value = {
      totalVaccineTypes: stockData.length,
      totalStock: stockData.reduce((sum, item) => sum + (item.totalQuantity || 0), 0),
      expiringCount: expiringData.total,
      expiringStock: expiringData.batches.reduce((sum, item) => sum + (item.quantity || 0), 0)
    }
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

const refreshData = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

const getExpiringCount = (vaccine) => {
  return vaccine.batches.filter(batch => batch.isExpiring).length
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
.dashboard-page {
  padding: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
