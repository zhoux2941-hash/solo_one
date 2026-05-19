<template>
  <div class="orders">
    <h2>订单管理</h2>
    
    <el-card>
      <el-table :data="orders" border stripe>
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column prop="plateNumber" label="车牌号" width="120">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.plateNumber }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parkingLotId" label="车场ID" width="100" />
        <el-table-column prop="entryTime" label="入场时间" width="180" />
        <el-table-column prop="exitTime" label="离场时间" width="180" />
        <el-table-column prop="parkingDuration" label="停车时长(分钟)" width="120" />
        <el-table-column prop="totalAmount" label="总金额" width="100">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold">¥{{ row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="实付金额" width="100">
          <template #default="{ row }">
            <span style="color: #67C23A; font-weight: bold">¥{{ row.paidAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.orderStatus)">
              {{ getStatusText(row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.orderStatus === 'UNPAID'" 
              type="success" 
              size="small" 
              link 
              @click="payOrder(row)"
            >
              支付
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const orders = ref([
  {
    orderNo: 'PK1234567890ABC',
    plateNumber: '京A12345',
    parkingLotId: 1,
    entryTime: '2026-05-18 09:30:00',
    exitTime: '2026-05-18 12:30:00',
    parkingDuration: 180,
    totalAmount: 15.00,
    paidAmount: 15.00,
    orderStatus: 'PAID'
  },
  {
    orderNo: 'PK1234567890DEF',
    plateNumber: '沪B67890',
    parkingLotId: 2,
    entryTime: '2026-05-18 10:15:00',
    exitTime: null,
    parkingDuration: null,
    totalAmount: 0.00,
    paidAmount: 0.00,
    orderStatus: 'PENDING'
  }
])

const getStatusType = (status) => {
  const map = {
    'PENDING': 'info',
    'UNPAID': 'warning',
    'PAID': 'success'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'PENDING': '待结算',
    'UNPAID': '待支付',
    'PAID': '已支付'
  }
  return map[status] || status
}

const payOrder = async (order) => {
  const res = await request.post(`/parking/order/${order.id}/pay`, null, {
    params: { payMethod: 'ONLINE' }
  })
  if (res.code === 200) {
    ElMessage.success('支付成功')
  }
}

onMounted(() => {})
</script>

<style scoped>
.orders {
  padding: 20px;
}

.orders h2 {
  margin-bottom: 20px;
  color: #333;
}
</style>
