<template>
  <div class="approvals">
    <el-card>
      <template #header>
        <span>审批流转</span>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="待我审批" name="pending">
          <el-table :data="pendingApprovals" style="width: 100%">
            <el-table-column prop="orderNo" label="工单号" width="140" />
            <el-table-column prop="title" label="工单标题" />
            <el-table-column prop="deviceName" label="设备名称" width="120" />
            <el-table-column prop="creatorName" label="申请人" width="100" />
            <el-table-column prop="createTime" label="申请时间" width="160">
              <template #default="scope">
                {{ formatTime(scope.row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="viewDetail(scope.row.id)">查看</el-button>
                <el-button size="small" type="success" @click="quickApprove(scope.row.id, true)">通过</el-button>
                <el-button size="small" type="danger" @click="quickApprove(scope.row.id, false)">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="我已审批" name="approved">
          <el-table :data="approvedList" style="width: 100%">
            <el-table-column prop="orderNo" label="工单号" width="140" />
            <el-table-column prop="title" label="工单标题" />
            <el-table-column prop="deviceName" label="设备名称" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="申请时间" width="160">
              <template #default="scope">
                {{ formatTime(scope.row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button size="small" @click="viewDetail(scope.row.id)">查看</el-button>
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
import { useRouter } from 'vue-router'
import { useUserStore } from '../store'
import { workOrderApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('pending')
const pendingApprovals = ref([])
const approvedList = ref([])

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

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

const viewDetail = (id) => {
  router.push(`/workorder-detail/${id}`)
}

const quickApprove = async (id, approved) => {
  try {
    await ElMessageBox.confirm(
      `确认${approved ? '通过' : '驳回'}该工单？`,
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const user = userStore.user
    const data = {
      approverId: user.id,
      comment: approved ? '审批通过' : '审批驳回',
      approved
    }
    
    if (user.role === 'TEAM_LEADER') {
      await workOrderApi.approveByLeader(id, data)
    } else if (user.role === 'ADMIN') {
      await workOrderApi.approveByAdmin(id, data)
    }
    
    ElMessage.success(approved ? '审批通过' : '审批驳回')
    loadPendingApprovals()
  } catch {
  }
}

const loadPendingApprovals = async () => {
  const user = userStore.user
  if (user.role === 'TEAM_LEADER') {
    pendingApprovals.value = await workOrderApi.getPendingTeamLeader(user.id)
  } else if (user.role === 'ADMIN') {
    pendingApprovals.value = await workOrderApi.getPendingAdmin(user.id)
  }
}

const loadApprovedList = async () => {
  const allOrders = await workOrderApi.getAll()
  const user = userStore.user
  approvedList.value = allOrders.filter(o => {
    if (user.role === 'TEAM_LEADER') {
      return o.teamLeaderStatus === 'APPROVED' || o.teamLeaderStatus === 'REJECTED'
    } else if (user.role === 'ADMIN') {
      return o.adminStatus === 'APPROVED' || o.adminStatus === 'REJECTED'
    }
    return false
  })
}

onMounted(() => {
  loadPendingApprovals()
  loadApprovedList()
})
</script>

<style scoped>
</style>
