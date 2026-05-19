<template>
  <div class="orders">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="user.nickname" label="用户" width="120" />
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥{{ row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="payStatus" label="支付状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.payStatus === 1 ? 'success' : 'warning'">
              {{ row.payStatus === 1 ? '已支付' : '待支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderStatus" label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusType(row.orderStatus)">
              {{ getOrderStatusText(row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortStatus" label="分拣状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.sortStatus === 1 ? 'success' : 'info'">
              {{ row.sortStatus === 1 ? '已分拣' : '待分拣' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryStatus" label="配送状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.deliveryStatus === 2 ? 'success' : row.deliveryStatus === 1 ? 'warning' : 'info'">
              {{ getDeliveryStatusText(row.deliveryStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-button
              v-if="row.payStatus === 1 && row.sortStatus === 0"
              size="small"
              type="primary"
              @click="handleSort(row)"
            >
              标记分拣
            </el-button>
            <el-button
              v-if="row.sortStatus === 1 && row.deliveryStatus === 0"
              size="small"
              type="warning"
              @click="handleStartDelivery(row)"
            >
              开始配送
            </el-button>
            <el-button
              v-if="row.deliveryStatus === 1"
              size="small"
              type="success"
              @click="handleCompleteDelivery(row)"
            >
              完成配送
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="订单详情" width="700px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentOrder.user?.nickname }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ currentOrder.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="支付金额">¥{{ currentOrder.payAmount }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="currentOrder.payStatus === 1 ? 'success' : 'warning'">
            {{ currentOrder.payStatus === 1 ? '已支付' : '待支付' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          {{ getOrderStatusText(currentOrder.orderStatus) }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentOrder.createTime }}</el-descriptions-item>
      </el-descriptions>

      <h4 style="margin: 20px 0 10px">商品明细</h4>
      <el-table :data="orderItems" border size="small">
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="totalAmount" label="小计" width="100">
          <template #default="{ row }">¥{{ row.totalAmount }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const currentOrder = ref(null)
const orderItems = ref([])

const getOrderStatusText = (status) => {
  const map = { 0: '待支付', 1: '已支付', 2: '已分拣', 3: '配送中', 4: '已完成' }
  return map[status] || '未知'
}

const getOrderStatusType = (status) => {
  const map = { 0: 'warning', 1: 'primary', 2: 'info', 3: 'warning', 4: 'success' }
  return map[status] || 'info'
}

const getDeliveryStatusText = (status) => {
  const map = { 0: '待配送', 1: '配送中', 2: '已送达' }
  return map[status] || '未知'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/orders')
    tableData.value = res.data
  } finally {
    loading.value = false
  }
}

const handleViewDetail = async (row) => {
  currentOrder.value = row
  try {
    const res = await request.get(`/orders/${row.id}/items`)
    orderItems.value = res.data
  } catch (error) {
    orderItems.value = []
  }
  detailVisible.value = true
}

const handleSort = async (row) => {
  try {
    await request.put(`/orders/${row.id}/sort-status`, null, { params: { status: 1 } })
    ElMessage.success('分拣完成')
    loadData()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const handleStartDelivery = async (row) => {
  try {
    await request.put(`/orders/${row.id}/delivery-status`, null, { params: { status: 1 } })
    ElMessage.success('已开始配送')
    loadData()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const handleCompleteDelivery = async (row) => {
  try {
    await request.put(`/orders/${row.id}/delivery-status`, null, { params: { status: 2 } })
    ElMessage.success('配送完成')
    loadData()
  } catch (error) {
    console.error('操作失败:', error)
  }
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