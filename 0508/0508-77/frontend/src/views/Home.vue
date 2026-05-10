<template>
  <div class="home">
    <div class="actions">
      <el-button type="primary" size="large" @click="goToCreate">
        <el-icon><Plus /></el-icon>
        发起拼单
      </el-button>
      <el-button size="large" @click="goToStats">
        <el-icon><DataAnalysis /></el-icon>
        统计报表
      </el-button>
    </div>

    <el-tabs v-model="activeTab" class="tabs">
      <el-tab-pane label="进行中" name="active">
        <el-row :gutter="20">
          <el-col :span="8" v-for="order in activeOrders" :key="order.id">
            <el-card class="order-card" shadow="hover" @click="goToDetail(order.id)">
              <template #header>
                <div class="card-header">
                  <span class="merchant">{{ order.merchant }}</span>
                  <el-tag type="success">进行中</el-tag>
                </div>
              </template>
              <div class="order-info">
                <p>满减: 满{{ order.minAmount }}减{{ order.discountAmount }}</p>
                <p>发起人: {{ order.initiatorName }}</p>
                <p class="time">{{ formatTime(order.createdAt) }}</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="24" v-if="activeOrders.length === 0">
            <el-empty description="暂无进行中的拼单" />
          </el-col>
        </el-row>
      </el-tab-pane>
      
      <el-tab-pane label="历史记录" name="history">
        <el-table :data="allOrders" style="width: 100%">
          <el-table-column prop="merchant" label="商家" width="150" />
          <el-table-column label="满减规则" width="180">
            <template #default="{ row }">
              满{{ row.minAmount }}减{{ row.discountAmount }}
            </template>
          </el-table-column>
          <el-table-column prop="initiatorName" label="发起人" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额">
            <template #default="{ row }">
              <span v-if="row.status === 'ENDED'">
                原价 ¥{{ row.totalAmount }} → 实付 ¥{{ row.finalAmount }}
              </span>
              <span v-else>
                当前: ¥{{ row.totalAmount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" link @click="goToDetail(row.id)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, DataAnalysis } from '@element-plus/icons-vue'
import { orderApi } from '../api'

const router = useRouter()
const activeTab = ref('active')
const activeOrders = ref([])
const allOrders = ref([])

const loadData = async () => {
  try {
    activeOrders.value = await orderApi.getActive()
    allOrders.value = await orderApi.getAll()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})

const goToCreate = () => {
  router.push('/create')
}

const goToStats = () => {
  router.push('/stats')
}

const goToDetail = (id) => {
  router.push(`/order/${id}`)
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusType = (status) => {
  const map = {
    ACTIVE: 'success',
    ENDED: 'info',
    CANCELLED: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    ACTIVE: '进行中',
    ENDED: '已结束',
    CANCELLED: '已取消'
  }
  return map[status] || status
}
</script>

<style scoped>
.home {
  padding: 20px 0;
}

.actions {
  margin-bottom: 20px;
  text-align: right;
}

.tabs {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.order-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.order-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.merchant {
  font-size: 16px;
  font-weight: bold;
}

.order-info p {
  margin: 8px 0;
  color: #666;
}

.time {
  color: #999 !important;
  font-size: 12px;
}
</style>
