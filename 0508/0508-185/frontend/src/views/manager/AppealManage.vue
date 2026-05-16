<template>
  <div>
    <el-card>
      <template #header>
        <span>申诉处理</span>
      </template>
      <el-table :data="appeals" border>
        <el-table-column prop="id" label="申诉ID" width="100" />
        <el-table-column prop="employeeId" label="员工ID" width="100" />
        <el-table-column prop="reason" label="申诉原因" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag type="warning">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申诉时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="showProcessDialog(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="processDialogVisible" title="处理申诉" width="600px">
      <el-descriptions border style="margin-bottom: 20px">
        <el-descriptions-item label="申诉原因" :span="2">{{ currentAppeal?.reason }}</el-descriptions-item>
        <el-descriptions-item label="申诉时间">{{ currentAppeal?.createdAt }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="processForm" label-width="120px">
        <el-form-item label="处理结果">
          <el-radio-group v-model="processForm.status">
            <el-radio label="RESOLVED">已解决</el-radio>
            <el-radio label="REJECTED">已拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="新分配比例(%)" v-if="processForm.status === 'RESOLVED'">
          <el-input-number v-model="processForm.newPercentage" :min="0" :max="100" :precision="2" />
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input type="textarea" v-model="processForm.managerComment" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="processAppeal">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import appealApi from '@/api/appeal'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const appeals = ref([])
const processDialogVisible = ref(false)
const currentAppeal = ref(null)
const processForm = ref({
  status: 'RESOLVED',
  managerComment: '',
  newPercentage: 0
})

const statusText = (status) => {
  const texts = { PENDING: '待处理', RESOLVED: '已解决', REJECTED: '已拒绝' }
  return texts[status] || status
}

const loadAppeals = async () => {
  try {
    const response = await appealApi.getPending()
    appeals.value = response.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '加载申诉失败'
    ElMessage.error(errorMsg)
  }
}

const showProcessDialog = (appeal) => {
  currentAppeal.value = appeal
  processForm.value = {
    status: 'RESOLVED',
    managerComment: '',
    newPercentage: 0
  }
  processDialogVisible.value = true
}

const processAppeal = async () => {
  try {
    const data = {
      appealId: currentAppeal.value.id,
      status: processForm.value.status,
      managerComment: processForm.value.managerComment,
      newPercentage: processForm.value.status === 'RESOLVED' ? processForm.value.newPercentage : null,
      changeReason: '申诉调整',
      managerId: userStore.currentUser.id
    }
    await appealApi.process(data)
    processDialogVisible.value = false
    ElMessage.success('处理成功')
    loadAppeals()
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '处理失败'
    ElMessage.error(errorMsg)
  }
}

onMounted(() => {
  loadAppeals()
})
</script>
