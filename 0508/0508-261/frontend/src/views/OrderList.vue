<template>
  <div class="order-list">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button type="primary" @click="$router.push('/create')">
            <el-icon><Plus /></el-icon>
            新建订单
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="queryForm.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="queryForm.userId" placeholder="请输入用户ID" clearable />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="queryForm.status" placeholder="请选择订单状态" clearable>
            <el-option label="待支付" value="CREATED" />
            <el-option label="已支付" value="PAID" />
            <el-option label="已发货" value="SHIPPED" />
            <el-option label="已签收" value="DELIVERED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button type="reset" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orderList" v-loading="loading" style="width: 100%">
        <el-table-column prop="orderNo" label="订单号" min-width="200" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="scope">
            ¥{{ scope.row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receiverName" label="收货人" width="100" />
        <el-table-column prop="receiverPhone" label="手机号" width="130" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" min-width="250" fixed="right">
          <template #default="scope">
            <el-button link @click="viewDetail(scope.row.orderNo)">详情</el-button>
            <el-button link v-if="scope.row.status === 'CREATED'" @click="handlePay(scope.row.orderNo)">支付</el-button>
            <el-button link v-if="scope.row.status === 'PAID'" @click="handleShip(scope.row.orderNo)">发货</el-button>
            <el-button link v-if="scope.row.status === 'SHIPPED'" @click="handleDeliver(scope.row.orderNo)">签收</el-button>
            <el-button link v-if="scope.row.status === 'CREATED'" @click="handleCancel(scope.row.orderNo)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { queryOrders, payOrder, shipOrder, deliverOrder, cancelOrder } from '@/api/order'

const router = useRouter()
const loading = ref(false)
const orderList = ref([])

const queryForm = ref({
  orderNo: '',
  userId: '',
  status: ''
})

const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const pageOrderIdSet = ref(new Set())

const deduplicatePageOrders = (orders) => {
  const orderMap = new Map()
  for (const order of orders) {
    if (!orderMap.has(order.orderNo)) {
      orderMap.set(order.orderNo, order)
    }
  }
  return Array.from(orderMap.values())
}

const clearOrderIdSet = () => {
  pageOrderIdSet.value.clear()
}

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

const loadOrders = async () => {
  loading.value = true
  try {
    const params = {
      ...queryForm.value,
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    }
    const res = await queryOrders(params)
    
    const uniqueOrders = deduplicatePageOrders(res.data.list)
    orderList.value = uniqueOrders
    pagination.value.total = res.data.total
    
    console.log(`第 ${pagination.value.pageNum} 页加载完成, 去重后数量: ${uniqueOrders.length}`)
  } catch (error) {
    console.error('加载订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  pagination.value.pageNum = 1
  clearOrderIdSet()
  loadOrders()
}

watch([() => queryForm.value.orderNo, () => queryForm.value.userId, () => queryForm.value.status], () => {
  clearOrderIdSet()
}, { deep: true })

const handleReset = () => {
  queryForm.value = {
    orderNo: '',
    userId: '',
    status: ''
  }
  handleQuery()
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.pageNum = 1
  loadOrders()
}

const handleCurrentChange = (page) => {
  pagination.value.pageNum = page
  loadOrders()
}

const viewDetail = (orderNo) => {
  router.push(`/order/${orderNo}`)
}

const handlePay = async (orderNo) => {
  try {
    await ElMessageBox.confirm('确认支付该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await payOrder(orderNo)
    ElMessage.success('支付成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '支付失败')
    }
  }
}

const handleShip = async (orderNo) => {
  try {
    await ElMessageBox.confirm('确认发货吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await shipOrder(orderNo)
    ElMessage.success('发货成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '发货失败')
    }
  }
}

const handleDeliver = async (orderNo) => {
  try {
    await ElMessageBox.confirm('确认签收吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deliverOrder(orderNo)
    ElMessage.success('签收成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '签收失败')
    }
  }
}

const handleCancel = async (orderNo) => {
  try {
    await ElMessageBox.confirm('确认取消该订单吗？取消后库存将回滚', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cancelOrder(orderNo, '用户手动取消')
    ElMessage.success('取消成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '取消失败')
    }
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>