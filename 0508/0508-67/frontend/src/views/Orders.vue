<template>
  <div class="orders">
    <div class="page-header">
      <h2>送水工单管理</h2>
      <el-button type="primary" @click="refreshData" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="待处理工单" name="pending">
          <el-table :data="pendingOrders" stripe v-loading="loading" :expand-row-keys="expandedKeys" @expand-change="handleExpandChange">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="expand-content" v-if="row.machineCount > 1">
                  <h4>合并的饮水机 (共 {{ row.machineCount }} 台):</h4>
                  <el-table :data="getMachineList(row)" border style="margin-top: 10px;">
                    <el-table-column prop="machineId" label="饮水机ID" width="120" />
                    <el-table-column prop="location" label="位置" />
                    <el-table-column prop="remainingLiters" label="剩余水量" width="150">
                      <template #default="{ scope }">
                        <span style="color: #f56c6c; font-weight: bold;">{{ scope.row.remainingLiters?.toFixed(1) }} L</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div class="expand-content" v-else>
                  <p>单台饮水机工单</p>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="orderId" label="工单号" width="100" />
            <el-table-column prop="floor" label="楼层" width="100">
              <template #default="{ row }">
                {{ row.floor }}楼
              </template>
            </el-table-column>
            <el-table-column prop="machineCount" label="饮水机数量" width="120">
              <template #default="{ row }">
                <el-tag :type="row.machineCount > 1 ? 'primary' : 'info'" effect="light">
                  {{ row.machineCount }} 台
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="主要位置">
              <template #default="{ row }">
                <span v-if="row.machineCount > 1">
                  {{ row.location }} 等
                  <el-tag type="info" effect="plain" size="small" style="margin-left: 8px;">合并工单</el-tag>
                </span>
                <span v-else>{{ row.location }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="remainingLiters" label="最低水量" width="120">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: bold;">{{ row.remainingLiters?.toFixed(1) }} L</span>
              </template>
            </el-table-column>
            <el-table-column prop="orderTime" label="下单时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.orderTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="success" size="small" @click="confirmDelivery(row)">
                  <el-icon><Check /></el-icon>
                  已送达
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingOrders.length === 0" description="暂无待处理工单" />
        </el-tab-pane>
        
        <el-tab-pane label="全部工单" name="all">
          <el-table :data="allOrders" stripe v-loading="loading">
            <el-table-column prop="orderId" label="工单号" width="100" />
            <el-table-column prop="floor" label="楼层" width="100">
              <template #default="{ row }">
                {{ row.floor }}楼
              </template>
            </el-table-column>
            <el-table-column prop="machineCount" label="饮水机数量" width="120">
              <template #default="{ row }">
                <el-tag :type="row.machineCount > 1 ? 'primary' : 'info'" effect="light">
                  {{ row.machineCount }} 台
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置">
              <template #default="{ row }">
                <span v-if="row.machineCount > 1">
                  {{ row.location }} 等 {{ row.machineCount }} 处
                </span>
                <span v-else>{{ row.location }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="remainingLiters" label="最低水量" width="120">
              <template #default="{ row }">
                {{ row.remainingLiters?.toFixed(1) }} L
              </template>
            </el-table-column>
            <el-table-column prop="orderTime" label="下单时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.orderTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="deliveredTime" label="送达时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.deliveredTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="responseTimeMinutes" label="响应时长" width="100">
              <template #default="{ row }">
                {{ row.responseTimeMinutes ? row.responseTimeMinutes + ' 分钟' : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'">
                  {{ row.status === 'COMPLETED' ? '已完成' : '待处理' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Check } from '@element-plus/icons-vue'
import { getAllOrders, deliverOrder } from '../api'

const activeTab = ref('pending')
const pendingOrders = ref([])
const allOrders = ref([])
const loading = ref(false)
const expandedKeys = ref([])

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const getMachineList = (order) => {
  if (!order.machineIds || !order.machineLocations) {
    return []
  }
  
  const list = []
  for (let i = 0; i < order.machineIds.length; i++) {
    list.push({
      machineId: order.machineIds[i],
      location: order.machineLocations[i] || '未知位置',
      remainingLiters: order.remainingLitersList?.[i] || order.remainingLiters
    })
  }
  return list
}

const handleExpandChange = (row, expanded) => {
  if (expanded) {
    expandedKeys.value = [row.orderId]
  } else {
    expandedKeys.value = []
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    const response = await getAllOrders()
    allOrders.value = response.data
    pendingOrders.value = response.data.filter(o => o.status === 'PENDING')
  } catch (error) {
    ElMessage.error('获取工单列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const confirmDelivery = async (order) => {
  const machineCount = order.machineCount || 1
  let message = '确认送水工已完成送水？'
  
  if (machineCount > 1) {
    message = `确认已为该楼层 ${machineCount} 台饮水机全部送水？\n\n涉及的饮水机:\n${order.machineLocations?.join('\n') || ''}`
  }
  
  try {
    await ElMessageBox.confirm(message, '确认送达', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    await deliverOrder(order.orderId)
    ElMessage.success(`工单已完成，已为 ${machineCount} 台饮水机加水`)
    await refreshData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.orders {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expand-content {
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 4px;
}

.expand-content h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
}

.expand-content p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}
</style>
