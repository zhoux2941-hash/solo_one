<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">二审审批（主管）</h2>
      <el-alert 
        type="warning" 
        :closable="false" 
        style="margin-bottom: 0;"
      >
        注意：一审通过后需在24小时内完成二审，超时将自动驳回
      </el-alert>
    </div>

    <el-table :data="applications" style="width: 100%" border v-loading="loading">
      <el-table-column prop="id" label="申请编号" width="100" />
      <el-table-column label="申请人" width="120">
        <template #default="scope">
          {{ scope.row.applicant.realName }}
        </template>
      </el-table-column>
      <el-table-column label="化学品" width="150">
        <template #default="scope">
          {{ scope.row.chemical.name }}
        </template>
      </el-table-column>
      <el-table-column label="危险等级" width="100">
        <template #default="scope">
          <el-tag :type="getDangerTagType(scope.row.chemical.dangerLevel)">
            {{ getDangerLevelName(scope.row.chemical.dangerLevel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="库存检查" width="150">
        <template #default="scope">
          <el-tag :type="checkStock(scope.row) ? 'success' : 'danger'">
            {{ checkStock(scope.row) ? '库存充足' : '库存不足' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="申请数量" width="120">
        <template #default="scope">
          {{ scope.row.quantity }} {{ scope.row.chemical.unit }}
        </template>
      </el-table-column>
      <el-table-column label="剩余时间" width="120">
        <template #default="scope">
          <el-tag :type="getTimeType(scope.row.id)">
            {{ getRemainingTime(scope.row.id) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
      <el-table-column label="一审意见" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.safetyComment || '无' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button 
            type="success" 
            size="small" 
            :disabled="!checkStock(scope.row)"
            @click="handleReview(scope.row, true)"
          >
            通过
          </el-button>
          <el-button type="danger" size="small" @click="handleReview(scope.row, false)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && applications.length === 0" description="暂无待二审的申请" />

    <el-dialog v-model="reviewDialogVisible" title="审批意见" width="500px">
      <el-form :model="reviewForm" ref="reviewFormRef" label-width="80px">
        <el-form-item label="申请编号">
          <el-input :value="selectedApplication?.id" disabled />
        </el-form-item>
        <el-form-item label="化学品">
          <el-input :value="selectedApplication?.chemical.name" disabled />
        </el-form-item>
        <el-form-item label="申请数量">
          <el-input :value="`${selectedApplication?.quantity} ${selectedApplication?.chemical.unit}`" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="`${selectedApplication?.chemical.currentStock} ${selectedApplication?.chemical.unit}`" disabled />
        </el-form-item>
        <el-form-item label="一审意见">
          <el-input :value="selectedApplication?.safetyComment || '无'" type="textarea" disabled :rows="2" />
        </el-form-item>
        <el-form-item label="用途">
          <el-input :value="selectedApplication?.purpose" type="textarea" disabled :rows="2" />
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="reviewForm.comment" type="textarea" :rows="3" placeholder="请输入审批意见（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button :type="reviewForm.approved ? 'success' : 'danger'" @click="submitReview" :loading="reviewLoading">
          {{ reviewForm.approved ? '确认通过（扣减库存）' : '确认驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPendingSecondReview, secondReview, getRemainingTime } from '../api/application'

const applications = ref([])
const loading = ref(false)
const reviewDialogVisible = ref(false)
const reviewLoading = ref(false)
const reviewFormRef = ref(null)
const selectedApplication = ref(null)
const remainingTimes = ref({})
let timer = null

const reviewForm = reactive({
  comment: '',
  approved: false
})

const getDangerLevelName = (level) => {
  const map = { HIGH: '高', MEDIUM: '中', LOW: '低' }
  return map[level] || level
}

const getDangerTagType = (level) => {
  const map = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' }
  return map[level] || 'info'
}

const checkStock = (application) => {
  return application.chemical.currentStock >= application.quantity
}

const loadApplications = async () => {
  loading.value = true
  try {
    applications.value = await getPendingSecondReview()
    await loadAllRemainingTimes()
  } catch (error) {
    console.error('Failed to load applications:', error)
  } finally {
    loading.value = false
  }
}

const loadAllRemainingTimes = async () => {
  for (const app of applications.value) {
    try {
      const result = await getRemainingTime(app.id)
      remainingTimes.value[app.id] = result.remainingMinutes
    } catch (error) {
      remainingTimes.value[app.id] = -1
    }
  }
}

const getRemainingTime = (appId) => {
  const minutes = remainingTimes.value[appId]
  if (minutes == null || minutes < 0) return '已过期'
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分钟`
}

const getTimeType = (appId) => {
  const minutes = remainingTimes.value[appId]
  if (minutes == null || minutes < 0) return 'danger'
  if (minutes < 60) return 'warning'
  return 'success'
}

const handleReview = (application, approved) => {
  selectedApplication.value = application
  reviewForm.comment = ''
  reviewForm.approved = approved
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  reviewLoading.value = true
  try {
    await secondReview(selectedApplication.value.id, reviewForm.approved, reviewForm.comment)
    ElMessage.success(reviewForm.approved ? '二审通过，库存已扣减' : '二审驳回')
    reviewDialogVisible.value = false
    loadApplications()
  } catch (error) {
    console.error('Failed to review:', error)
  } finally {
    reviewLoading.value = false
  }
}

onMounted(() => {
  loadApplications()
  timer = setInterval(async () => {
    await loadAllRemainingTimes()
  }, 60000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>
