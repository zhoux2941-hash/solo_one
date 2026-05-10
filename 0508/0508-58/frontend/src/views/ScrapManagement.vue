<template>
  <div class="scrap-management-page">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Delete /></el-icon>
        报废管理
      </h2>
    </div>

    <el-card class="mb-20">
      <template #header>
        <div class="card-header">
          <span>
            <el-icon color="#f56c6c"><Warning /></el-icon>
            过期疫苗列表
          </span>
          <div class="card-actions">
            <el-button
              type="danger"
              @click="handleBatchScrap"
              :disabled="selectedBatches.length === 0"
              :loading="loading"
            >
              <el-icon><Delete /></el-icon>
              批量报废 ({{ selectedBatches.length }})
            </el-button>
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-if="expiredBatches.length > 0"
        :data="expiredBatches"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="vaccineName" label="疫苗名称" width="180" />
        <el-table-column prop="batchNumber" label="批号" width="150" />
        <el-table-column prop="productionDate" label="生产日期" width="120" />
        <el-table-column prop="expiryDate" label="有效期" width="120" />
        <el-table-column prop="quantity" label="库存数量" width="100" align="center" />
        <el-table-column label="过期天数" width="120" align="center">
          <template #default="scope">
            <el-tag type="danger" effect="dark">
              已过期 {{ Math.abs(scope.row.daysUntilExpiry) }} 天
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无过期疫苗" />
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>
            <el-icon color="#67c23a"><Document /></el-icon>
            报废记录
          </span>
        </div>
      </template>

      <el-table
        v-if="scrapRecords.length > 0"
        :data="scrapRecords"
        style="width: 100%"
        border
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="vaccineName" label="疫苗名称" width="180" />
        <el-table-column prop="batchNumber" label="批号" width="150" />
        <el-table-column prop="scrapQuantity" label="报废数量" width="100" align="center">
          <template #default="scope">
            <el-tag type="danger">-{{ scope.row.scrapQuantity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="报废原因" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="scrappedAt" label="报废时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.scrappedAt) }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无报废记录" />
    </el-card>

    <el-dialog
      v-model="scrapDialogVisible"
      title="确认报废"
      width="500px"
    >
      <el-form :model="scrapForm" label-width="100px">
        <el-alert
          :title="`将报废 ${selectedBatches.length} 个批次的疫苗，请确认报废原因：`"
          type="warning"
          show-icon
          class="mb-20"
        />
        <el-form-item
          label="报废原因"
          required
        >
          <el-input
            v-model="scrapForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入报废原因（如：已过期、质量问题等）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input
            v-model="scrapForm.operator"
            placeholder="请输入操作人姓名"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="scrapDialogVisible = false">取消</el-button>
          <el-button
            type="danger"
            :loading="scrapLoading"
            @click="confirmScrap"
          >
            确认报废
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExpiredBatches, scrapBatches, getScrapRecords } from '../api/vaccine'

const expiredBatches = ref([])
const scrapRecords = ref([])
const selectedBatches = ref([])
const loading = ref(false)
const scrapLoading = ref(false)
const scrapDialogVisible = ref(false)

const scrapForm = ref({
  reason: '',
  operator: ''
})

const fetchData = async () => {
  try {
    const [expiredData, recordsData] = await Promise.all([
      getExpiredBatches(),
      getScrapRecords()
    ])
    expiredBatches.value = expiredData.batches
    scrapRecords.value = recordsData
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

const refreshData = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

const handleSelectionChange = (selection) => {
  selectedBatches.value = selection
}

const handleBatchScrap = () => {
  if (selectedBatches.value.length === 0) {
    ElMessage.warning('请先选择要报废的批次')
    return
  }
  scrapForm.value.reason = ''
  scrapForm.value.operator = ''
  scrapDialogVisible.value = true
}

const confirmScrap = async () => {
  if (!scrapForm.value.reason || scrapForm.value.reason.trim() === '') {
    ElMessage.warning('请输入报废原因')
    return
  }

  scrapLoading.value = true
  try {
    const result = await scrapBatches({
      batchIds: selectedBatches.value.map(batch => batch.id),
      reason: scrapForm.value.reason,
      operator: scrapForm.value.operator || '系统管理员'
    })

    scrapDialogVisible.value = false

    if (result.success) {
      ElMessage.success(result.message)
      selectedBatches.value = []
      fetchData()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('报废失败:', error)
    ElMessage.error('报废失败，请稍后重试')
  } finally {
    scrapLoading.value = false
  }
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.scrap-management-page {
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

.card-actions {
  display: flex;
  gap: 10px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
