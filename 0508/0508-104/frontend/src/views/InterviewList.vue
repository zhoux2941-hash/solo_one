<template>
  <div class="interview-container">
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          面试名单查询
          <el-tag type="warning" style="margin-left: 10px" size="small">
            <el-icon style="margin-right: 4px"><Edit /></el-icon>
            支持手动调整
          </el-tag>
        </div>
      </template>

      <el-select
        v-model="selectedDepartmentId"
        placeholder="请选择部门"
        style="width: 200px"
        @change="fetchInterviewList"
      >
        <el-option
          v-for="dept in departments"
          :key="dept.id"
          :label="dept.name"
          :value="dept.id"
        />
      </el-select>

      <el-button 
        type="primary" 
        @click="fetchInterviewList" 
        style="margin-left: 16px"
        :loading="loading"
      >
        <el-icon><Search /></el-icon>
        查询
      </el-button>

      <el-button 
        type="warning" 
        @click="fetchAllInterviewLists"
        style="margin-left: 16px"
        :loading="loading"
      >
        <el-icon><List /></el-icon>
        查看所有部门名单
      </el-button>
    </el-card>

    <div v-if="selectedDepartmentId" class="table-card">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>{{ selectedDepartmentName }} - 面试名单</span>
            <el-tag type="info" style="margin-left: 10px">
              共 {{ interviewList.length }} 人
            </el-tag>
          </div>
        </template>

        <el-table :data="groupedData" style="width: 100%" stripe @row-click="handleRowClick">
          <el-table-column label="时间段" prop="assignedSlot" width="180">
            <template #default="scope">
              <div class="slot-cell">
                <el-tag type="primary">{{ scope.row.assignedSlot }}</el-tag>
                <el-button 
                  type="primary" 
                  size="small" 
                  link
                  @click.stop="openAdjustDialog(scope.row, selectedDepartmentId)"
                >
                  <el-icon><Edit /></el-icon>
                  调整
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="姓名" prop="name" width="120" />
          <el-table-column label="学号" prop="studentId" width="150" />
          <el-table-column label="分配类型" width="120">
            <template #default="scope">
              <el-tag :type="getPriorityType(scope.row.priority)">
                {{ getPriorityLabel(scope.row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="接受调剂" width="100">
            <template #default="scope">
              <span>{{ scope.row.acceptAdjustment ? '是' : '否' }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <div v-if="showAllDepartments" class="all-departments">
      <el-collapse v-model="activeNames">
        <el-collapse-item 
          v-for="dept in departmentsWithCount" 
          :key="dept.id"
          :name="dept.id"
        >
          <template #title>
            <div class="collapse-title">
              <span>{{ dept.name }}</span>
              <el-tag type="info" style="margin-left: 10px">
                {{ dept.assignedCount }} / {{ dept.maxCapacity }} 人
              </el-tag>
            </div>
          </template>

          <el-table :data="getDepartmentList(dept.id)" style="width: 100%" stripe>
            <el-table-column label="时间段" prop="assignedSlot" width="180">
              <template #default="scope">
                <div class="slot-cell">
                  <el-tag type="primary">{{ scope.row.assignedSlot }}</el-tag>
                  <el-button 
                    type="primary" 
                    size="small" 
                    link
                    @click.stop="openAdjustDialog(scope.row, dept.id)"
                  >
                    <el-icon><Edit /></el-icon>
                    调整
                  </el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="姓名" prop="name" width="120" />
            <el-table-column label="学号" prop="studentId" width="150" />
            <el-table-column label="分配类型" width="120">
              <template #default="scope">
                <el-tag :type="getPriorityType(scope.row.priority)">
                  {{ getPriorityLabel(scope.row.priority) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-empty v-if="!selectedDepartmentId && !showAllDepartments" description="请选择部门查看面试名单" />

    <el-dialog 
      v-model="adjustDialogVisible" 
      title="调整面试时间" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="adjustForm" label-width="120px">
        <el-form-item label="报名者">
          <el-input :value="adjustApplicant?.name" disabled>
            <template #prepend>姓名</template>
          </el-input>
          <el-input :value="adjustApplicant?.studentId" disabled style="margin-top: 10px">
            <template #prepend>学号</template>
          </el-input>
        </el-form-item>

        <el-form-item label="原安排">
          <el-tag type="info">
            {{ currentDeptName }} - {{ adjustApplicant?.assignedSlot }}
          </el-tag>
        </el-form-item>

        <el-form-item label="目标部门">
          <el-select 
            v-model="adjustForm.targetDepartmentId" 
            placeholder="请选择目标部门"
            style="width: 100%"
            @change="onDepartmentChange"
          >
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目标时间段">
          <div v-if="availableSlots.length === 0" class="no-slots-tip">
            <el-empty description="请先选择目标部门" :image-size="80" />
          </div>
          <div v-else class="slots-grid">
            <div 
              v-for="slot in availableSlots" 
              :key="slot.slot"
              class="slot-item"
              :class="{
                'slot-available': slot.available,
                'slot-full': !slot.available,
                'slot-selected': adjustForm.targetSlot === slot.slot,
                'slot-current': slot.slot === adjustApplicant?.assignedSlot && adjustForm.targetDepartmentId === currentDeptId
              }"
              @click="selectSlot(slot)"
            >
              <div class="slot-time">{{ slot.slot }}</div>
              <div class="slot-capacity" :class="slot.available ? 'text-success' : 'text-danger'">
                {{ slot.currentCount }}/{{ slot.maxCapacity }}
              </div>
              <div v-if="slot.slot === adjustApplicant?.assignedSlot && adjustForm.targetDepartmentId === currentDeptId" class="slot-badge">
                当前
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item v-if="conflictCheckResult" label="冲突检测">
          <div v-if="conflictCheckResult.hasConflict" class="conflict-box">
            <el-alert
              v-for="(conflict, index) in conflictCheckResult.conflicts"
              :key="index"
              :title="conflict"
              type="error"
              :closable="false"
              show-icon
              style="margin-bottom: 8px"
            />
          </div>
          <div v-else-if="conflictCheckResult.hasWarning" class="warning-box">
            <el-alert
              v-for="(warning, index) in conflictCheckResult.warnings"
              :key="index"
              :title="warning"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 8px"
            />
          </div>
          <div v-else class="success-box">
            <el-alert
              title="未检测到冲突，可以调整"
              type="success"
              :closable="false"
              show-icon
            />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeAdjustDialog">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmAdjust"
          :loading="adjusting"
          :disabled="!canAdjust"
        >
          确认调整
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const departments = ref([])
const interviewList = ref([])
const allInterviewLists = ref({})
const selectedDepartmentId = ref(null)
const loading = ref(false)
const activeNames = ref([])
const showAllDepartments = ref(false)

const adjustDialogVisible = ref(false)
const adjustApplicant = ref(null)
const currentDeptId = ref(null)
const currentDeptName = ref('')
const availableSlots = ref([])
const conflictCheckResult = ref(null)
const adjusting = ref(false)

const adjustForm = ref({
  targetDepartmentId: null,
  targetSlot: ''
})

const selectedDepartmentName = computed(() => {
  const dept = departments.value.find(d => d.id === selectedDepartmentId.value)
  return dept ? dept.name : ''
})

const groupedData = computed(() => {
  return interviewList.value.sort((a, b) => {
    return a.assignedSlot.localeCompare(b.assignedSlot)
  })
})

const departmentsWithCount = computed(() => {
  return departments.value.map(dept => ({
    ...dept,
    assignedCount: (allInterviewLists.value[dept.id] || []).length
  }))
})

const canAdjust = computed(() => {
  return adjustForm.value.targetDepartmentId 
    && adjustForm.value.targetSlot 
    && conflictCheckResult.value 
    && !conflictCheckResult.value.hasConflict
})

const fetchDepartments = async () => {
  try {
    const res = await request.get('/departments')
    departments.value = res.data
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

const fetchInterviewList = async () => {
  if (!selectedDepartmentId.value) return
  
  loading.value = true
  showAllDepartments.value = false
  
  try {
    const res = await request.get(`/applicants/interview-list/${selectedDepartmentId.value}`)
    interviewList.value = res.data
  } catch (error) {
    console.error('获取面试名单失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchAllInterviewLists = async () => {
  loading.value = true
  showAllDepartments.value = true
  selectedDepartmentId.value = null
  allInterviewLists.value = {}

  try {
    for (const dept of departments.value) {
      const res = await request.get(`/applicants/interview-list/${dept.id}`)
      allInterviewLists.value[dept.id] = res.data
    }
    activeNames.value = departments.value.map(d => d.id)
  } catch (error) {
    console.error('获取面试名单失败:', error)
  } finally {
    loading.value = false
  }
}

const getDepartmentList = (deptId) => {
  const list = allInterviewLists.value[deptId] || []
  return list.sort((a, b) => a.assignedSlot.localeCompare(b.assignedSlot))
}

const getPriorityType = (priority) => {
  if (priority === 0) return 'success'
  if (priority === 1) return 'primary'
  if (priority === 2) return 'warning'
  if (priority === 3) return 'danger'
  return 'info'
}

const getPriorityLabel = (priority) => {
  if (priority === 0) return '调剂'
  if (priority === 1) return '第一志愿'
  if (priority === 2) return '第二志愿'
  if (priority === 3) return '第三志愿'
  return '未知'
}

const handleRowClick = (row) => {
  console.log('Row clicked:', row)
}

const openAdjustDialog = async (row, deptId) => {
  adjustApplicant.value = row
  currentDeptId.value = deptId
  currentDeptName.value = departments.value.find(d => d.id === deptId)?.name || ''
  
  adjustForm.value = {
    targetDepartmentId: deptId,
    targetSlot: row.assignedSlot
  }
  
  conflictCheckResult.value = null
  availableSlots.value = []
  
  adjustDialogVisible.value = true
  
  await fetchAvailableSlots(deptId)
  await checkConflict()
}

const closeAdjustDialog = () => {
  adjustDialogVisible.value = false
  adjustApplicant.value = null
  currentDeptId.value = null
  conflictCheckResult.value = null
  availableSlots.value = []
}

const onDepartmentChange = async (deptId) => {
  adjustForm.value.targetSlot = ''
  conflictCheckResult.value = null
  await fetchAvailableSlots(deptId)
}

const fetchAvailableSlots = async (deptId) => {
  try {
    const res = await request.get(`/departments/${deptId}/slots`)
    availableSlots.value = res.data
  } catch (error) {
    console.error('获取时间段失败:', error)
    availableSlots.value = []
  }
}

const selectSlot = async (slot) => {
  if (!slot.available && !(slot.slot === adjustApplicant.value?.assignedSlot && adjustForm.value.targetDepartmentId === currentDeptId.value)) {
    ElMessage.warning('该时间段已满')
    return
  }
  
  adjustForm.value.targetSlot = slot.slot
  await checkConflict()
}

const checkConflict = async () => {
  if (!adjustForm.value.targetDepartmentId || !adjustForm.value.targetSlot) {
    conflictCheckResult.value = null
    return
  }

  try {
    const res = await request.post('/applicants/check-conflict', null, {
      params: {
        applicantId: adjustApplicant.value.applicantId,
        targetDepartmentId: adjustForm.value.targetDepartmentId,
        targetSlot: adjustForm.value.targetSlot
      }
    })
    conflictCheckResult.value = res.data
  } catch (error) {
    console.error('冲突检测失败:', error)
    conflictCheckResult.value = null
  }
}

const confirmAdjust = async () => {
  if (!canAdjust.value) return

  try {
    await ElMessageBox.confirm(
      `确认将 ${adjustApplicant.value.name}(${adjustApplicant.value.studentId}) 的面试时间调整到 ${adjustForm.value.targetSlot} 吗？`,
      '确认调整',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    adjusting.value = true
    const res = await request.post('/applicants/adjust-interview', {
      applicantId: adjustApplicant.value.applicantId,
      targetDepartmentId: adjustForm.value.targetDepartmentId,
      targetSlot: adjustForm.value.targetSlot
    })

    ElMessage.success(res.data.message)
    closeAdjustDialog()
    
    if (selectedDepartmentId.value) {
      await fetchInterviewList()
    }
    if (showAllDepartments.value) {
      await fetchAllInterviewLists()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '调整失败')
    }
  } finally {
    adjusting.value = false
  }
}

onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.interview-container {
  padding: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #667eea;
}

.collapse-title {
  font-size: 16px;
  font-weight: bold;
}

.all-departments {
  margin-top: 20px;
}

.slot-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.slot-item {
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  text-align: center;
}

.slot-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.slot-available {
  background: #f0f9eb;
  border-color: #67c23a;
}

.slot-full {
  background: #fef0f0;
  border-color: #f56c6c;
  opacity: 0.7;
  cursor: not-allowed;
}

.slot-selected {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
}

.slot-current {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.slot-time {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.slot-capacity {
  font-size: 12px;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.slot-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e6a23c;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.no-slots-tip {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.conflict-box, .warning-box, .success-box {
  width: 100%;
}
</style>