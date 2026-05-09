<template>
  <div class="page-container">
    <div class="page-card">
      <h3 class="page-title">审批管理</h3>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="待审批" name="pending">
          <el-table :data="pendingList" border stripe v-loading="loading">
            <el-table-column prop="id" label="申请编号" width="100" />
            <el-table-column prop="userName" label="申请人" width="120" />
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column prop="reagentName" label="试剂名称" width="150" />
            <el-table-column prop="quantity" label="领用数量" width="100" />
            <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
            <el-table-column prop="createTime" label="申请时间" width="180" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button type="success" size="small" link @click="openApproveDialog(row)">通过</el-button>
                <el-button type="danger" size="small" link @click="openRejectDialog(row)">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingList.length === 0" description="暂无待审批申请" />
        </el-tab-pane>
        
        <el-tab-pane label="全部申请" name="all">
          <el-table :data="allList" border stripe v-loading="loading">
            <el-table-column prop="id" label="申请编号" width="100" />
            <el-table-column prop="userName" label="申请人" width="120" />
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column prop="reagentName" label="试剂名称" width="150" />
            <el-table-column prop="quantity" label="领用数量" width="100" />
            <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="approverName" label="审批人" width="100" />
            <el-table-column prop="remark" label="审批意见" show-overflow-tooltip />
            <el-table-column prop="createTime" label="申请时间" width="180" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="approveDialogVisible" title="审批通过" width="450px">
      <el-form label-width="100px">
        <el-form-item label="申请人">
          <el-input :value="currentReq?.userName" disabled />
        </el-form-item>
        <el-form-item label="试剂">
          <el-input :value="currentReq?.reagentName" disabled />
        </el-form-item>
        <el-form-item label="数量">
          <el-input :value="currentReq?.quantity" disabled />
        </el-form-item>
        <el-form-item label="用途">
          <el-input :value="currentReq?.purpose" type="textarea" :rows="2" disabled />
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveRemark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="success" @click="handleApprove" :loading="submitting">确认通过</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectDialogVisible" title="驳回申请" width="450px">
      <el-form label-width="100px">
        <el-form-item label="申请人">
          <el-input :value="currentReq?.userName" disabled />
        </el-form-item>
        <el-form-item label="试剂">
          <el-input :value="currentReq?.reagentName" disabled />
        </el-form-item>
        <el-form-item label="数量">
          <el-input :value="currentReq?.quantity" disabled />
        </el-form-item>
        <el-form-item label="驳回原因">
          <el-input v-model="rejectRemark" type="textarea" :rows="3" placeholder="请填写驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleReject" :loading="submitting">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const activeTab = ref('pending')
const pendingList = ref([])
const allList = ref([])
const loading = ref(false)
const submitting = ref(false)

const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const currentReq = ref(null)
const approveRemark = ref('')
const rejectRemark = ref('')

const getStatusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已驳回' }
  return map[status] || status
}

const loadPending = async () => {
  loading.value = true
  try {
    const res = await request.get('/requisition/pending')
    pendingList.value = res.data
  } finally {
    loading.value = false
  }
}

const loadAll = async () => {
  loading.value = true
  try {
    const res = await request.get('/requisition/list')
    allList.value = res.data
  } finally {
    loading.value = false
  }
}

const openApproveDialog = (row) => {
  currentReq.value = row
  approveRemark.value = ''
  approveDialogVisible.value = true
}

const openRejectDialog = (row) => {
  currentReq.value = row
  rejectRemark.value = ''
  rejectDialogVisible.value = true
}

const handleApprove = async () => {
  submitting.value = true
  try {
    await request.post('/requisition/approve', {
      id: currentReq.value.id,
      approverId: user.value.id,
      remark: approveRemark.value
    })
    ElMessage.success('审批通过')
    approveDialogVisible.value = false
    loadPending()
    loadAll()
  } finally {
    submitting.value = false
  }
}

const handleReject = async () => {
  if (!rejectRemark.value) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  submitting.value = true
  try {
    await request.post('/requisition/reject', {
      id: currentReq.value.id,
      approverId: user.value.id,
      remark: rejectRemark.value
    })
    ElMessage.success('已驳回')
    rejectDialogVisible.value = false
    loadPending()
    loadAll()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadPending()
  loadAll()
})
</script>
