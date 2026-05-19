<template>
  <div class="workorder-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>工单详情</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>

      <el-descriptions :column="2" border v-if="workOrder">
        <el-descriptions-item label="工单号">{{ workOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(workOrder.status)">
            {{ getStatusText(workOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ workOrder.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="workOrder.priority === 'HIGH' ? 'danger' : 'warning'">
            {{ workOrder.priority === 'HIGH' ? '高' : '中' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ workOrder.creatorName }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ workOrder.assigneeName || '未分配' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatTime(workOrder.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="工单标题" :span="2">{{ workOrder.title }}</el-descriptions-item>
        <el-descriptions-item label="故障描述" :span="2">{{ workOrder.description }}</el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 30px">
        <h4 style="margin-bottom: 15px">审批流程</h4>
        <el-steps :active="getApprovalStep()" finish-status="success">
          <el-step title="创建工单" />
          <el-step title="组长审批" />
          <el-step title="管理员审批" />
          <el-step title="处理完成" />
        </el-steps>
      </div>

      <div v-if="canApprove()" style="margin-top: 30px">
        <h4 style="margin-bottom: 15px">审批操作</h4>
        <el-form :model="approvalForm" label-width="100px">
          <el-form-item label="审批意见">
            <el-input v-model="approvalForm.comment" type="textarea" :rows="3" placeholder="请输入审批意见" />
          </el-form-item>
          <el-form-item>
            <el-button type="success" @click="approve(true)">通过</el-button>
            <el-button type="danger" @click="approve(false)">驳回</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="canProcess()" style="margin-top: 30px">
        <h4 style="margin-bottom: 15px">处理工单</h4>
        <el-button type="primary" @click="showMaintenanceForm = true">填写维修记录</el-button>
      </div>

      <div v-if="approvals.length > 0" style="margin-top: 30px">
        <h4 style="margin-bottom: 15px">审批记录</h4>
        <el-table :data="approvals" style="width: 100%">
          <el-table-column label="审批级别" width="100">
            <template #default="scope">
              {{ scope.row.approvalLevel === 1 ? '组长审批' : '管理员审批' }}
            </template>
          </el-table-column>
          <el-table-column prop="approverName" label="审批人" width="100" />
          <el-table-column label="结果" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.approvalResult === 'APPROVED' ? 'success' : 'danger'">
                {{ scope.row.approvalResult === 'APPROVED' ? '通过' : '驳回' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="comment" label="意见" />
          <el-table-column prop="approvalTime" label="时间" width="160">
            <template #default="scope">
              {{ formatTime(scope.row.approvalTime) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-dialog v-model="showMaintenanceForm" title="填写维修记录" width="700px">
      <el-form 
        :model="maintenanceForm" 
        :rules="maintenanceRules" 
        ref="maintenanceFormRef"
        label-width="100px"
      >
        <el-form-item label="故障描述" prop="faultDescription">
          <el-input 
            v-model="maintenanceForm.faultDescription" 
            type="textarea" 
            :rows="5"
            placeholder="请详细描述故障现象（支持富文本描述）"
            maxlength="50000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="解决方案" prop="solution">
          <el-input 
            v-model="maintenanceForm.solution" 
            type="textarea" 
            :rows="5"
            placeholder="请详细描述维修过程和解决方案（支持富文本描述）"
            maxlength="50000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="更换配件" prop="replacedParts">
          <el-input 
            v-model="maintenanceForm.replacedParts" 
            type="textarea" 
            :rows="3"
            placeholder="请列出更换的零配件名称、型号、数量等"
            maxlength="10000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="耗时(小时)" prop="laborHours">
          <el-input-number v-model="maintenanceForm.laborHours" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <div style="text-align: right; padding: 10px 20px; color: #999; font-size: 12px;">
        提示：支持录入大量图文备注内容，单字段最大50000字符
      </div>
      <template #footer>
        <el-button @click="resetMaintenanceForm">重置</el-button>
        <el-button @click="showMaintenanceForm = false">取消</el-button>
        <el-button type="primary" @click="submitMaintenance" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store'
import { workOrderApi, maintenanceLogApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const workOrder = ref(null)
const approvals = ref([])
const showMaintenanceForm = ref(false)
const maintenanceFormRef = ref(null)
const submitting = ref(false)

const approvalForm = reactive({
  comment: ''
})

const maintenanceForm = reactive({
  workOrderId: null,
  deviceId: null,
  maintainerId: null,
  faultDescription: '',
  solution: '',
  replacedParts: '',
  laborHours: 0,
  result: 'SUCCESS'
})

const maintenanceRules = {
  faultDescription: [
    { required: true, message: '请输入故障描述', trigger: 'blur' },
    { max: 50000, message: '故障描述不能超过50000字符', trigger: 'blur' }
  ],
  solution: [
    { required: true, message: '请输入解决方案', trigger: 'blur' },
    { max: 50000, message: '解决方案不能超过50000字符', trigger: 'blur' }
  ],
  replacedParts: [
    { max: 10000, message: '更换配件信息不能超过10000字符', trigger: 'blur' }
  ],
  laborHours: [
    { required: true, message: '请输入耗时', trigger: 'blur' }
  ]
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

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const getApprovalStep = () => {
  if (!workOrder.value) return 0
  const status = workOrder.value.status
  if (status === 'COMPLETED') return 4
  if (status === 'ADMIN_APPROVED' || status === 'ASSIGNED' || status === 'IN_PROGRESS') return 3
  if (status === 'LEADER_APPROVED') return 2
  if (status === 'PENDING') return 1
  return 0
}

const canApprove = computed(() => {
  if (!workOrder.value) return false
  const user = userStore.user
  if (!user) return false
  
  if (user.role === 'TEAM_LEADER' && workOrder.value.status === 'PENDING') {
    return true
  }
  if (user.role === 'ADMIN' && workOrder.value.status === 'LEADER_APPROVED') {
    return true
  }
  return false
})

const canProcess = computed(() => {
  if (!workOrder.value) return false
  const user = userStore.user
  if (!user || user.role !== 'WORKER') return false
  
  return ['ADMIN_APPROVED', 'ASSIGNED', 'IN_PROGRESS'].includes(workOrder.value.status)
})

const approve = async (approved) => {
  try {
    const user = userStore.user
    const data = {
      approverId: user.id,
      comment: approvalForm.comment,
      approved
    }
    
    if (user.role === 'TEAM_LEADER') {
      await workOrderApi.approveByLeader(route.params.id, data)
    } else if (user.role === 'ADMIN') {
      await workOrderApi.approveByAdmin(route.params.id, data)
    }
    
    ElMessage.success(approved ? '审批通过' : '审批驳回')
    loadData()
  } catch (error) {
    if (error.isConflict) {
      ElMessage.error(error.message)
      loadData()
    } else {
      ElMessage.error('操作失败：' + (error.message || '未知错误'))
    }
  }
}

const resetMaintenanceForm = () => {
  if (maintenanceFormRef.value) {
    maintenanceFormRef.value.resetFields()
  }
}

const submitMaintenance = async () => {
  if (!maintenanceFormRef.value) return
  
  await maintenanceFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      await ElMessageBox.confirm(
        '确认提交维修记录？提交后工单将标记为完成。',
        '提示',
        { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
      )
      
      submitting.value = true
      maintenanceForm.workOrderId = workOrder.value.id
      maintenanceForm.deviceId = workOrder.value.deviceId
      maintenanceForm.maintainerId = userStore.user.id
      
      await maintenanceLogApi.create(maintenanceForm)
      
      ElMessage.success('维修记录提交成功')
      showMaintenanceForm.value = false
      resetMaintenanceForm()
      loadData()
    } catch (error) {
      if (error !== 'cancel') {
        if (error.isConflict) {
          ElMessage.error(error.message)
          loadData()
        } else if (error.isPayloadTooLarge || error.response?.status === 413) {
          ElMessage.error('提交内容过大，请精简图文内容后重试（单字段建议不超过50000字符）')
        } else {
          ElMessage.error('提交失败：' + (error.message || '网络异常，请检查网络连接'))
        }
      }
    } finally {
      submitting.value = false
    }
  })
}

const loadData = async () => {
  workOrder.value = await workOrderApi.getById(route.params.id)
  approvals.value = await workOrderApi.getApprovals(route.params.id)
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
