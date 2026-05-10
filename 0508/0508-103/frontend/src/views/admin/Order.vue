<template>
  <div class="order-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-radio-group v-model="statusFilter" @change="handleFilter">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="待核销">待核销</el-radio-button>
            <el-radio-button label="已核销">已核销</el-radio-button>
            <el-radio-button label="已取消">已取消</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      
      <el-table :data="orders" border>
        <el-table-column prop="orderNo" label="订单编号" width="220" />
        <el-table-column prop="residentId" label="居民ID" width="100" />
        <el-table-column prop="productName" label="商品名称" width="150" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="pointsConsumed" label="消耗积分" width="100">
          <template #default="scope">
            <el-tag type="danger">{{ scope.row.pointsConsumed }} 分</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="verifyTime" label="核销时间" width="180">
          <template #default="scope">
            {{ scope.row.verifyTime ? formatTime(scope.row.verifyTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <template v-if="scope.row.status === '待核销'">
              <el-button type="success" size="small" @click="handleVerify(scope.row.id)">
                核销
              </el-button>
              <el-popconfirm title="确定取消该订单吗？" @confirm="handleCancel(scope.row.id)">
                <template #reference>
                  <el-button type="danger" size="small">取消</el-button>
                </template>
              </el-popconfirm>
            </template>
            <template v-else>
              <span class="text-muted">-</span>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { orderApi } from '@/api'

const orders = ref([])
const statusFilter = ref('')

const getOrders = async () => {
  let res
  if (statusFilter.value) {
    res = await orderApi.getByStatus(statusFilter.value)
  } else {
    res = await orderApi.list()
  }
  orders.value = res.data
}

const handleFilter = () => {
  getOrders()
}

const handleVerify = async (id) => {
  await orderApi.verify(id)
  ElMessage.success('核销成功')
  getOrders()
}

const handleCancel = async (id) => {
  await orderApi.cancel(id)
  ElMessage.success('取消成功，积分已退还')
  getOrders()
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusTag = (status) => {
  const map = {
    '待核销': 'warning',
    '已核销': 'success',
    '已取消': 'info'
  }
  return map[status] || 'info'
}

onMounted(() => {
  getOrders()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-muted {
  color: #909399;
}
</style>
