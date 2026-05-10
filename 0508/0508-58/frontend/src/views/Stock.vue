<template>
  <div class="stock-page">
    <div class="page-header">
      <h2 class="page-title">疫苗库存</h2>
      <el-button type="primary" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-card>
      <el-table
        :data="vaccineStock"
        style="width: 100%"
        row-key="vaccineId"
        border
      >
        <el-table-column type="expand">
          <template #default="props">
            <el-table
              :data="props.row.batches"
              style="width: 100%; margin: 10px 0"
              :row-class-name="batchRowClassName"
              border
            >
              <el-table-column prop="batchNumber" label="批号" width="180" />
              <el-table-column prop="productionDate" label="生产日期" width="120" />
              <el-table-column prop="expiryDate" label="有效期" width="120" />
              <el-table-column prop="quantity" label="库存数量" width="120" align="center" />
              <el-table-column label="距离过期" width="120" align="center">
                <template #default="scope">
                  <el-tag
                    v-if="scope.row.daysUntilExpiry < 0"
                    type="danger"
                    effect="dark"
                  >
                    已过期
                  </el-tag>
                  <el-tag
                    v-else-if="scope.row.daysUntilExpiry <= 7"
                    type="danger"
                  >
                    {{ scope.row.daysUntilExpiry }} 天
                  </el-tag>
                  <el-tag
                    v-else-if="scope.row.daysUntilExpiry <= 30"
                    type="warning"
                  >
                    {{ scope.row.daysUntilExpiry }} 天
                  </el-tag>
                  <el-tag v-else type="success">
                    {{ scope.row.daysUntilExpiry }} 天
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="120" align="center">
                <template #default="scope">
                  <el-tag
                    v-if="scope.row.daysUntilExpiry < 0"
                    type="danger"
                    effect="dark"
                  >
                    已过期
                  </el-tag>
                  <el-tag
                    v-else-if="scope.row.daysUntilExpiry <= 7"
                    type="danger"
                  >
                    紧急
                  </el-tag>
                  <el-tag
                    v-else-if="scope.row.daysUntilExpiry <= 30"
                    type="warning"
                  >
                    警告
                  </el-tag>
                  <el-tag v-else type="success">
                    正常
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column prop="vaccineName" label="疫苗名称" width="200" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="manufacturer" label="生产厂家" width="150" />
        <el-table-column prop="totalQuantity" label="总库存" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getStockTagType(scope.row.totalQuantity)">
              {{ scope.row.totalQuantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="批次数量" width="120" align="center">
          <template #default="scope">
            {{ scope.row.batches.length }}
          </template>
        </el-table-column>
        <el-table-column label="近效期批次" width="150" align="center">
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
import { getVaccineStock } from '../api/vaccine'

const vaccineStock = ref([])

const fetchData = async () => {
  try {
    const data = await getVaccineStock()
    vaccineStock.value = data
  } catch (error) {
    console.error('获取疫苗库存失败:', error)
  }
}

const refreshData = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

const getExpiringCount = (vaccine) => {
  return vaccine.batches.filter(batch => batch.isExpiring).length
}

const getStockTagType = (quantity) => {
  if (quantity <= 0) return 'danger'
  if (quantity <= 50) return 'warning'
  return 'success'
}

const batchRowClassName = ({ row }) => {
  if (row.daysUntilExpiry <= 30 && row.daysUntilExpiry >= 0) {
    return 'expiring-row'
  }
  return ''
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.stock-page {
  padding: 20px;
}
</style>
