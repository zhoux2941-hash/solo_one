<template>
  <div class="approval-progress">
    <el-steps :active="getCurrentStep()" finish-status="success" simple>
      <el-step title="提交申请" :status="getStatusForStep(0)" />
      <el-step title="安全员一审" :status="getStatusForStep(1)" />
      <el-step title="主管二审" :status="getStatusForStep(2)" />
      <el-step title="完成" :status="getStatusForStep(3)" />
    </el-steps>
    <div class="status-badge">
      <el-tag :type="getStatusTagType()">{{ getStatusName() }}</el-tag>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const statusConfig = {
  PENDING_FIRST_REVIEW: { step: 0, label: '待一审', tagType: 'warning' },
  PENDING_SECOND_REVIEW: { step: 1, label: '待二审', tagType: 'warning' },
  FIRST_REVIEW_REJECTED: { step: 1, label: '一审驳回', tagType: 'danger' },
  SECOND_REVIEW_REJECTED: { step: 2, label: '二审驳回', tagType: 'danger' },
  COMPLETED: { step: 3, label: '已完成', tagType: 'success' },
  AUTO_REJECTED: { step: 2, label: '超时自动驳回', tagType: 'danger' }
}

const getCurrentStep = () => {
  return statusConfig[props.status]?.step || 0
}

const getStatusName = () => {
  return statusConfig[props.status]?.label || props.status
}

const getStatusTagType = () => {
  return statusConfig[props.status]?.tagType || 'info'
}

const getStatusForStep = (stepIndex) => {
  const currentStep = getCurrentStep()
  
  if (props.status === 'FIRST_REVIEW_REJECTED' || props.status === 'SECOND_REVIEW_REJECTED' || props.status === 'AUTO_REJECTED') {
    if (stepIndex < currentStep) return 'success'
    if (stepIndex === currentStep) return 'error'
    return ''
  }
  
  if (stepIndex < currentStep) return 'success'
  if (stepIndex === currentStep) return 'process'
  return ''
}
</script>

<style scoped>
.approval-progress {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 15px;
}

.status-badge {
  margin-top: 10px;
  text-align: center;
}
</style>
