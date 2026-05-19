<template>
  <div class="workorders">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>工单管理</span>
          <el-button type="primary" @click="$router.push('/workorder-create')">
            <el-icon><Plus /></el-icon>
            新建工单
          </el-button>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="工单状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable @change="loadData">
            <el-option label="全部" value="" />
            <el-option label="待审批" value="PENDING" />
            <el-option label="审批中" value="APPROVING" />
            <el-option label="处理中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="workOrders" style="width: 100%">
        <el-table-column prop="orderNo" label="工单号" width="140" />
        <el-table-column prop="title" label="工单标题" />
        <el-table-column prop="deviceName" label="设备名称" width="120" />
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.priority === 'HIGH' ? 'danger' : 'warning'">
              {{ scope.row.priority === 'HIGH' ? '高' : '中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="创建人" width="100" />
        <el-table-column prop="assigneeName" label="处理人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row.id)">详情</el-button>
            <el-button 
              v-if="canClaim(scope.row)" 
              size="small" 
              type="primary" 
              @click="claimOrder(scope.row.id)"
            >
              认领
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store'
import { workOrderApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const workOrders = ref([])
const searchForm = ref({
  status: ''
})

const getStatusType = (status) => {
  const map = {
    'PENDING': 'warning',
    'LEADER_APPROVED': 'primary',
    'ADMIN_APPROVED': 'primary',
    'ASSIGNED': 'info',
    'IN_PROGRESS': 'info',
    'COMPLETED': 'success',
    'REJECTED': 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'PENDING': '待审批',
    'LEADER_APPROVED': '组长已批',
    'ADMIN_APPROVED': '管理员已批',
    'ASSIGNED': '已分配',
    'IN_PROGRESS': '处理中',
    'COMPLETED': '已完成',
    'REJECTED': '已驳回'
  }
  return map[status] || status
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const canClaim = (row) => {
  const user = userStore.user
  if (!user || user.role !== 'WORKER') return false
  return ['ADMIN_APPROVED', 'ASSIGNED'].includes(row.status) && !row.assigneeId
}

const viewDetail = (id) => {
  router.push(`/workorder-detail/${id}`)
}

const claimOrder = async (id) => {
  try {
    await ElMessageBox.confirm('确认认领该工单？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await workOrderApi.claim(id, { assigneeId: userStore.user.id })
    ElMessage.success('认领成功')
    loadData()
  } catch {
  }
}

const loadData = async () => {
  let data
  if (searchForm.value.status) {
    data = await workOrderApi.getByStatus(searchForm.value.status)
  } else {
    data = await workOrderApi.getAll()
  }
  workOrders.value = data
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

.search-form {
  margin-bottom: 20px;
}
</style>
