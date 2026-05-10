<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的预约</span>
          <el-tabs v-model="activeTab" @tab-change="loadReservations" style="margin-bottom: 0;">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="待使用" name="PENDING" />
            <el-tab-pane label="使用中" name="ACTIVE" />
            <el-tab-pane label="已完成" name="COMPLETED" />
            <el-tab-pane label="已过期" name="EXPIRED" />
          </el-tabs>
        </div>
      </template>

      <el-table :data="filteredReservations" v-loading="loading" style="width: 100%;">
        <el-table-column prop="pile.pileCode" label="桩号" width="100">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.pile?.pileCode }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="pile.location" label="位置" min-width="150">
          <template #default="{ row }">
            <el-icon style="margin-right: 5px;"><Location /></el-icon>
            {{ row.pile?.location }}
          </template>
        </el-table-column>
        
        <el-table-column label="预约时间" width="250">
          <template #default="{ row }">
            <div>{{ formatDateTime(row.startTime) }}</div>
            <div style="color: #909399; font-size: 12px;">
              至 {{ formatTime(row.endTime) }} (30分钟)
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING'">
              <el-button type="success" size="small" @click="handleUseReservation(row.id)" :loading="actionLoading[row.id]">
                使用
              </el-button>
              <el-button type="danger" size="small" @click="handleCancelReservation(row.id)" :loading="actionLoading[row.id]">
                取消
              </el-button>
              <el-tooltip content="请在15分钟内使用，否则自动释放">
                <el-icon style="color: #e6a23c; cursor: help;"><Warning /></el-icon>
              </el-tooltip>
            </template>
            
            <template v-else-if="row.status === 'ACTIVE'">
              <el-button type="primary" size="small" @click="handleCompleteReservation(row.id)" :loading="actionLoading[row.id]">
                完成
              </el-button>
            </template>
            
            <template v-else>
              <span style="color: #909399;">-</span>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="filteredReservations.length === 0 && !loading" description="暂无预约记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { 
  getMyReservations, 
  useReservation as apiUseReservation, 
  completeReservation as apiCompleteReservation, 
  cancelReservation as apiCancelReservation 
} from '@/api/reservations'

const reservations = ref([])
const loading = ref(false)
const activeTab = ref('all')
const actionLoading = ref({})

const filteredReservations = computed(() => {
  if (activeTab.value === 'all') {
    return reservations.value
  }
  return reservations.value.filter(r => r.status === activeTab.value)
})

const loadReservations = async () => {
  loading.value = true
  try {
    const res = await getMyReservations()
    reservations.value = (res.data || []).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  } catch (e) {
    console.error('Failed to load reservations:', e)
  } finally {
    loading.value = false
  }
}

const formatDateTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const formatTime = (time) => {
  return dayjs(time).format('HH:mm')
}

const getStatusText = (status) => {
  const texts = {
    'PENDING': '待使用',
    'ACTIVE': '使用中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消',
    'EXPIRED': '已过期'
  }
  return texts[status] || status
}

const getStatusTagType = (status) => {
  const types = {
    'PENDING': 'warning',
    'ACTIVE': 'success',
    'COMPLETED': 'info',
    'CANCELLED': 'info',
    'EXPIRED': 'danger'
  }
  return types[status] || 'info'
}

const handleUseReservation = async (id) => {
  try {
    await ElMessageBox.confirm('确认开始使用该充电桩？', '确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    actionLoading.value[id] = true
    await apiUseReservation(id)
    ElMessage.success('开始使用')
    await loadReservations()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to use reservation:', e)
    }
  } finally {
    actionLoading.value[id] = false
  }
}

const handleCompleteReservation = async (id) => {
  try {
    await ElMessageBox.confirm('确认完成充电？', '确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    actionLoading.value[id] = true
    await apiCompleteReservation(id)
    ElMessage.success('充电完成')
    await loadReservations()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to complete reservation:', e)
    }
  } finally {
    actionLoading.value[id] = false
  }
}

const handleCancelReservation = async (id) => {
  try {
    await ElMessageBox.confirm('确认取消该预约？', '确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    actionLoading.value[id] = true
    await apiCancelReservation(id)
    ElMessage.success('已取消预约')
    await loadReservations()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to cancel reservation:', e)
    }
  } finally {
    actionLoading.value[id] = false
  }
}

onMounted(() => {
  loadReservations()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
