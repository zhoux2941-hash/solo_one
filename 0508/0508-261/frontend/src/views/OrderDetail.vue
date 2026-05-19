<template>
  <div class="order-detail" v-loading="loading">
    <el-card shadow="hover" v-if="order">
      <template #header>
        <div class="card-header">
          <span>订单详情 - {{ order.orderNo }}</span>
          <div>
            <el-button type="primary" size="small" @click="$router.push('/')">返回列表</el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ order.userId }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">
          <span style="color: #f56c6c; font-weight: bold">¥{{ order.totalAmount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(order.status)">
            {{ getStatusText(order.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="收货人">{{ order.receiverName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ order.receiverPhone }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ order.receiverAddress }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ order.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ order.paymentTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发货时间">{{ order.shipTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="签收时间">{{ order.deliveryTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="取消时间">{{ order.cancelTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="取消原因" :span="2">{{ order.cancelReason || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>商品明细</el-divider>

      <el-table :data="order.items" style="width: 100%" border>
        <el-table-column prop="productId" label="商品ID" width="100" />
        <el-table-column prop="productName" label="商品名称" min-width="150" />
        <el-table-column prop="price" label="单价" width="120">
          <template #default="scope">¥{{ scope.row.price }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="totalPrice" label="小计" width="120">
          <template #default="scope">¥{{ scope.row.totalPrice }}</template>
        </el-table-column>
      </el-table>

      <el-divider>状态流转操作</el-divider>

      <div class="action-buttons">
        <el-button v-if="order.status === 'CREATED'" type="primary" @click="handlePay">
          <el-icon><CreditCard /></el-icon>
          立即支付
        </el-button>
        <el-button v-if="order.status === 'PAID'" type="success" @click="handleShip">
          <el-icon><Van /></el-icon>
          确认发货
        </el-button>
        <el-button v-if="order.status === 'SHIPPED'" type="warning" @click="handleDeliver">
          <el-icon><Check /></el-icon>
          确认签收
        </el-button>
        <el-button v-if="order.status === 'CREATED'" type="danger" @click="handleCancel">
          <el-icon><Close /></el-icon>
          取消订单
        </el-button>
      </div>

      <el-divider>履约日志</el-divider>

      <el-timeline>
        <el-timeline-item
          v-for="log in logs"
          :key="log.id"
          :timestamp="log.createdAt"
          placement="top"
          :type="getLogType(log.operationType)"
        >
          <template #dot>
            <el-icon v-if="log.operationType === 'CREATE'"><Document /></el-icon>
            <el-icon v-else-if="log.operationType === 'PAY'"><CreditCard /></el-icon>
            <el-icon v-else-if="log.operationType === 'SHIP'"><Van /></el-icon>
            <el-icon v-else-if="log.operationType === 'DELIVERY'"><Check /></el-icon>
            <el-icon v-else-if="log.operationType === 'CANCEL'"><Close /></el-icon>
            <el-icon v-else-if="log.operationType === 'COMPENSATE'"><Refresh /></el-icon>
          </template>
          <div class="log-item">
            <div class="log-desc">{{ log.operationDesc }}</div>
            <div class="log-operator">操作人: {{ log.operator }}</div>
            <div class="log-status">
              <span v-if="log.beforeStatus">状态: {{ getStatusText(log.beforeStatus) }} → {{ getStatusText(log.afterStatus) }}</span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CreditCard, Van, Check, Close, Document, Refresh } from '@element-plus/icons-vue'
import { getOrder, getOrderLogs, payOrder, shipOrder, deliverOrder, cancelOrder } from '@/api/order'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const order = ref(null)
const logs = ref([])

const getStatusText = (status) => {
  const statusMap = {
    CREATED: '待支付',
    PAID: '已支付',
    SHIPPED: '已发货',
    DELIVERED: '已签收',
    CANCELLED: '已取消'
  }
  return statusMap[status] || status
}

const getStatusType = (status) => {
  const typeMap = {
    CREATED: 'warning',
    PAID: 'primary',
    SHIPPED: 'info',
    DELIVERED: 'success',
    CANCELLED: 'danger'
  }
  return typeMap[status] || 'info'
}

const getLogType = (operationType) => {
  const typeMap = {
    CREATE: 'primary',
    PAY: 'success',
    SHIP: 'info',
    DELIVERY: 'success',
    CANCEL: 'danger',
    COMPENSATE: 'warning'
  }
  return typeMap[operationType] || 'info'
}

const loadOrderDetail = async () => {
  loading.value = true
  try {
    const orderNo = route.params.orderNo
    const [orderRes, logsRes] = await Promise.all([
      getOrder(orderNo),
      getOrderLogs(orderNo)
    ])
    order.value = orderRes.data
    logs.value = logsRes.data
  } catch (error) {
    console.error('加载订单详情失败:', error)
  } finally {
    loading.value = false
  }
}

const handlePay = async () => {
  try {
    await ElMessageBox.confirm('确认支付该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await payOrder(order.value.orderNo)
    ElMessage.success('支付成功')
    loadOrderDetail()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '支付失败')
    }
  }
}

const handleShip = async () => {
  try {
    await ElMessageBox.confirm('确认发货吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await shipOrder(order.value.orderNo)
    ElMessage.success('发货成功')
    loadOrderDetail()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '发货失败')
    }
  }
}

const handleDeliver = async () => {
  try {
    await ElMessageBox.confirm('确认签收吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deliverOrder(order.value.orderNo)
    ElMessage.success('签收成功')
    loadOrderDetail()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '签收失败')
    }
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确认取消该订单吗？取消后库存将回滚', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cancelOrder(order.value.orderNo, '用户手动取消')
    ElMessage.success('取消成功')
    loadOrderDetail()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '取消失败')
    }
  }
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.log-item {
  padding: 10px 0;
}

.log-desc {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

.log-operator,
.log-status {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>