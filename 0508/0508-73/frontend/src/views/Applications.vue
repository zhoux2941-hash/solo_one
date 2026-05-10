<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">我的申请</h2>
    </div>

    <el-table :data="applications" style="width: 100%" border v-loading="loading">
      <el-table-column prop="id" label="申请编号" width="100" />
      <el-table-column label="化学品" width="150">
        <template #default="scope">
          {{ scope.row.chemical.name }}
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="120">
        <template #default="scope">
          {{ scope.row.quantity }} {{ scope.row.chemical.unit }}
        </template>
      </el-table-column>
      <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
      <el-table-column prop="plannedReturnDate" label="计划归还日期" width="140">
        <template #default="scope">
          <span :class="scope.row.isOverdue ? 'stock-warning' : ''">
            {{ scope.row.plannedReturnDate }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="审批状态" width="140">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusName(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="申请时间" width="180" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button type="primary" size="small" link @click="showDetail(scope.row)">详情</el-button>
          <el-button 
            v-if="canReturn(scope.row)" 
            type="success" 
            size="small" 
            link 
            @click="handleReturn(scope.row)"
          >
            {{ scope.row.isOverdue ? '超期归还' : '归还' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="detailDialogVisible" title="申请详情" width="600px">
      <div v-if="selectedApplication">
        <ApprovalProgress :status="selectedApplication.status" />
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请编号">{{ selectedApplication.id }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ selectedApplication.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="化学品">{{ selectedApplication.chemical.name }}</el-descriptions-item>
          <el-descriptions-item label="CAS号">{{ selectedApplication.chemical.casNumber }}</el-descriptions-item>
          <el-descriptions-item label="领用数量">
            {{ selectedApplication.quantity }} {{ selectedApplication.chemical.unit }}
          </el-descriptions-item>
          <el-descriptions-item label="预计使用日期">{{ selectedApplication.expectedDate }}</el-descriptions-item>
          <el-descriptions-item label="计划归还日期" :class="selectedApplication.isOverdue ? 'stock-warning' : ''">
            {{ selectedApplication.plannedReturnDate }}
          </el-descriptions-item>
          <el-descriptions-item label="实际归还时间">
            {{ selectedApplication.actualReturnTime || '未归还' }}
          </el-descriptions-item>
          <el-descriptions-item label="用途" :span="2">{{ selectedApplication.purpose }}</el-descriptions-item>
          <el-descriptions-item v-if="selectedApplication.isOverdue" label="超期原因" :span="2">
            {{ selectedApplication.overdueReason || '无' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">审批记录</el-divider>
        
        <el-timeline>
          <el-timeline-item
            v-if="selectedApplication.createdAt"
            :timestamp="selectedApplication.createdAt"
            placement="top"
            type="primary"
          >
            <h4>提交申请</h4>
            <p>申请人：{{ selectedApplication.applicant.realName }}</p>
          </el-timeline-item>
          
          <el-timeline-item
            v-if="selectedApplication.safetyReviewTime"
            :timestamp="selectedApplication.safetyReviewTime"
            placement="top"
            :type="selectedApplication.status === 'FIRST_REVIEW_REJECTED' ? 'danger' : 'success'"
          >
            <h4>{{ selectedApplication.status === 'FIRST_REVIEW_REJECTED' ? '一审驳回' : '一审通过' }}</h4>
            <p>审批人：{{ selectedApplication.safetyOfficer?.realName }}</p>
            <p v-if="selectedApplication.safetyComment">意见：{{ selectedApplication.safetyComment }}</p>
          </el-timeline-item>
          
          <el-timeline-item
            v-if="selectedApplication.directorReviewTime"
            :timestamp="selectedApplication.directorReviewTime"
            placement="top"
            :type="selectedApplication.status === 'SECOND_REVIEW_REJECTED' ? 'danger' : 'success'"
          >
            <h4>{{ selectedApplication.status === 'SECOND_REVIEW_REJECTED' ? '二审驳回' : '二审通过' }}</h4>
            <p>审批人：{{ selectedApplication.director?.realName }}</p>
            <p v-if="selectedApplication.directorComment">意见：{{ selectedApplication.directorComment }}</p>
          </el-timeline-item>

          <el-timeline-item
            v-if="selectedApplication.status === 'AUTO_REJECTED'"
            placement="top"
            type="danger"
          >
            <h4>超时自动驳回</h4>
            <p>一审通过后24小时内未完成二审，系统自动驳回</p>
          </el-timeline-item>

          <el-timeline-item
            v-if="selectedApplication.actualReturnTime"
            :timestamp="selectedApplication.actualReturnTime"
            placement="top"
            type="success"
          >
            <h4>{{ selectedApplication.isOverdue ? '超期归还' : '归还完成' }}</h4>
            <p v-if="selectedApplication.overdueReason">超期原因：{{ selectedApplication.overdueReason }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <el-dialog v-model="returnDialogVisible" title="归还化学品" width="500px">
      <div v-if="returnApplication">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="化学品">{{ returnApplication.chemical.name }}</el-descriptions-item>
          <el-descriptions-item label="数量">
            {{ returnApplication.quantity }} {{ returnApplication.chemical.unit }}
          </el-descriptions-item>
          <el-descriptions-item label="计划归还日期">
            {{ returnApplication.plannedReturnDate }}
          </el-descriptions-item>
        </el-descriptions>
        
        <el-alert 
          v-if="returnApplication.isOverdue" 
          type="warning" 
          :closable="false"
          style="margin-top: 20px;"
        >
          注意：此申请已超期，请填写超期原因
        </el-alert>
        
        <el-form v-if="returnApplication.isOverdue" :model="returnForm" :rules="returnRules" ref="returnFormRef" style="margin-top: 20px;" label-width="100px">
          <el-form-item label="超期原因" prop="overdueReason">
            <el-input 
              v-model="returnForm.overdueReason" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入超期原因"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReturn" :loading="returnLoading">确认归还</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyApplications, returnChemical } from '../api/application'
import ApprovalProgress from '../components/ApprovalProgress.vue'

const applications = ref([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const selectedApplication = ref(null)
const returnDialogVisible = ref(false)
const returnApplication = ref(null)
const returnLoading = ref(false)
const returnFormRef = ref(null)

const returnForm = reactive({
  overdueReason: ''
})

const returnRules = {
  overdueReason: [{ required: true, message: '请输入超期原因', trigger: 'blur' }]
}

const statusMap = {
  PENDING_FIRST_REVIEW: { label: '待一审', type: 'warning' },
  PENDING_SECOND_REVIEW: { label: '待二审', type: 'warning' },
  FIRST_REVIEW_REJECTED: { label: '一审驳回', type: 'danger' },
  SECOND_REVIEW_REJECTED: { label: '二审驳回', type: 'danger' },
  COMPLETED: { label: '已完成', type: 'success' },
  AUTO_REJECTED: { label: '超时自动驳回', type: 'danger' },
  RETURNED: { label: '已归还', type: 'success' },
  OVERDUE: { label: '超期未归', type: 'danger' }
}

const getStatusName = (status) => {
  return statusMap[status]?.label || status
}

const getStatusTagType = (status) => {
  return statusMap[status]?.type || 'info'
}

const canReturn = (application) => {
  return (application.status === 'COMPLETED' || application.status === 'OVERDUE') && !application.actualReturnTime
}

const loadApplications = async () => {
  loading.value = true
  try {
    applications.value = await getMyApplications()
  } catch (error) {
    console.error('Failed to load applications:', error)
  } finally {
    loading.value = false
  }
}

const showDetail = (application) => {
  selectedApplication.value = application
  detailDialogVisible.value = true
}

const handleReturn = (application) => {
  returnApplication.value = application
  returnForm.overdueReason = ''
  returnDialogVisible.value = true
}

const submitReturn = async () => {
  if (returnApplication.value.isOverdue) {
    if (!returnFormRef.value) return
    await returnFormRef.value.validate()
  }
  
  returnLoading.value = true
  try {
    await returnChemical(returnApplication.value.id, returnForm.overdueReason)
    ElMessage.success('归还成功')
    returnDialogVisible.value = false
    loadApplications()
  } catch (error) {
    console.error('Failed to return:', error)
  } finally {
    returnLoading.value = false
  }
}

onMounted(() => {
  loadApplications()
})
</script>
