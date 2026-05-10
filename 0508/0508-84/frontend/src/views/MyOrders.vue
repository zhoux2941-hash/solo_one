<template>
  <div class="orders-container">
    <h2 class="page-title">我的订单</h2>
    
    <el-table :data="myOrders" border style="width: 100%;">
      <el-table-column prop="orderNo" label="订单编号" width="250"></el-table-column>
      <el-table-column prop="goodsName" label="物品名称" width="200"></el-table-column>
      <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
      <el-table-column prop="totalCoins" label="总花费" width="100">
        <template #default="scope">
          {{ scope.row.totalCoins }} 时间币
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" width="180">
        <template #default="scope">
          {{ formatTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button 
            type="danger" 
            link 
            v-if="scope.row.status === 'PENDING'"
            @click="handleCancel(scope.row)"
          >
            取消订单
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-empty v-if="myOrders.length === 0" description="暂无订单" style="margin-top: 50px;"></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrdersByUser, cancelOrder } from '../api/order'

const userStore = useUserStore()
const myOrders = ref([])

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusType = (status) => {
  const map = {
    'PENDING': 'warning',
    'DELIVERED': 'primary',
    'COMPLETED': 'success',
    'CANCELLED': 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'PENDING': '待发放',
    'DELIVERED': '已发放',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  }
  return map[status] || status
}

const loadData = async () => {
  const res = await getOrdersByUser(userStore.user.id)
  myOrders.value = res.data
}

const handleCancel = async (order) => {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？时间币将退回您的账户', '取消订单', {
      type: 'warning'
    })
    
    await cancelOrder(order.id)
    ElMessage.success('订单已取消，时间币已退回')
    await loadData()
    await userStore.refreshUser()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

onMounted(loadData)
</script>

<style scoped>
.orders-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 20px;
  color: #333;
}
</style>
