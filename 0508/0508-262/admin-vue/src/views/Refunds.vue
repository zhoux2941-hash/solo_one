<template>
  <div class="refunds">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>退款申请列表</span>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="refundNo" label="退款单号" width="180" />
        <el-table-column prop="order.orderNo" label="关联订单" width="180" />
        <el-table-column prop="user.nickname" label="申请人" width="120" />
        <el-table-column prop="refundAmount" label="退款金额" width="120">
          <template #default="{ row }">¥{{ row.refundAmount }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'">
              {{ row.status === 1 ? '已通过' : row.status === 2 ? '已拒绝' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="180" />
        <el-table-column label="操作" width="200" v-if="tableData.some(item => item.status === 0)">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" size="small" type="success" @click="handleAudit(row, 1)">
              通过
            </el-button>
            <el-button v-if="row.status === 0" size="small" type="danger" @click="handleAudit(row, 2)">
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/refunds')
    tableData.value = res.data
  } finally {
    loading.value = false
  }
}

const handleAudit = (row, status) => {
  const action = status === 1 ? '通过' : '拒绝'
  ElMessageBox.confirm(`确定${action}该退款申请吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await request.put(`/refunds/${row.id}/audit`, null, {
        params: { status, remark: `${action}申请` }
      })
      ElMessage.success('审核成功')
      loadData()
    } catch (error) {
      console.error('审核失败:', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>