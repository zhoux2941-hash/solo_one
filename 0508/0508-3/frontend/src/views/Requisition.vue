<template>
  <div class="page-container">
    <div class="page-card">
      <h3 class="page-title">领用申请管理</h3>

      <div class="search-bar">
        <el-row :gutter="16">
          <el-col :span="18">
            <el-button type="primary" @click="openApplyDialog" v-if="user.role === 'teacher'">
              新建领用申请
            </el-button>
          </el-col>
        </el-row>
      </div>

      <el-table :data="requisitions" border stripe>
        <el-table-column prop="id" label="申请编号" width="100" />
        <el-table-column prop="reagentName" label="试剂名称" width="150" />
        <el-table-column prop="quantity" label="领用数量" width="100" />
        <el-table-column prop="purpose" label="用途" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="审批意见" />
        <el-table-column prop="createTime" label="申请时间" width="180" />
        <el-table-column prop="approverName" label="审批人" width="100" v-if="user.role === 'admin'" />
      </el-table>
    </div>

    <el-dialog v-model="applyDialogVisible" title="新建领用申请" width="500px">
      <el-form :model="applyForm" label-width="100px">
        <el-form-item label="选择试剂">
          <el-select v-model="applyForm.reagentId" placeholder="请选择试剂" filterable style="width: 100%">
            <el-option
              v-for="item in availableReagents"
              :key="item.id"
              :label="`${item.name} (库存: ${item.quantity})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="领用数量">
          <el-input-number v-model="applyForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="用途">
          <el-input v-model="applyForm.purpose" type="textarea" :rows="3" placeholder="请说明用途" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const requisitions = ref([])
const reagents = ref([])
const loading = ref(false)
const applyDialogVisible = ref(false)

const applyForm = reactive({
  userId: null,
  reagentId: null,
  quantity: 1,
  purpose: ''
})

const availableReagents = ref([])

const getStatusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已驳回' }
  return map[status] || status
}

const loadRequisitions = async () => {
  const url = user.value.role === 'admin' 
    ? '/requisition/list' 
    : `/requisition/user/${user.value.id}`
  const res = await request.get(url)
  requisitions.value = res.data
}

const loadReagents = async () => {
  const res = await request.get('/reagent/list')
  reagents.value = res.data
  availableReagents.value = res.data.filter(r => r.quantity > 0)
}

const openApplyDialog = () => {
  applyForm.userId = user.value.id
  applyForm.reagentId = null
  applyForm.quantity = 1
  applyForm.purpose = ''
  applyDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!applyForm.reagentId) {
    ElMessage.warning('请选择试剂')
    return
  }
  if (!applyForm.purpose) {
    ElMessage.warning('请填写用途')
    return
  }
  const reagent = reagents.value.find(r => r.id === applyForm.reagentId)
  if (reagent && reagent.quantity < applyForm.quantity) {
    ElMessage.warning(`库存不足，当前库存: ${reagent.quantity}`)
    return
  }
  loading.value = true
  try {
    await request.post('/requisition/create', applyForm)
    ElMessage.success('申请提交成功')
    applyDialogVisible.value = false
    loadRequisitions()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRequisitions()
  loadReagents()
})
</script>
