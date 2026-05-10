<template>
  <div class="management-container">
    <el-card class="stats-card">
      <template #header>
        <div class="card-header">
          <el-icon><DataAnalysis /></el-icon>
          统计概览
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="总报名人数" :value="stats.totalApplicants">
            <template #suffix>人</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="已分配人数" :value="stats.assignedCount">
            <template #suffix>人</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="待分配人数" :value="stats.unassignedCount">
            <template #suffix>人</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="部门数量" :value="stats.departmentCount">
            <template #suffix>个</template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="action-card">
      <template #header>
        <div class="card-header">
          <el-icon><Operation /></el-icon>
          自动分配
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="action-tip">
            <el-icon color="#e6a23c"><Warning /></el-icon>
            <span>系统将根据报名者的意向部门和空闲时间段，自动分配面试时间</span>
          </div>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-button 
            type="danger" 
            @click="handleReset"
            :loading="resetting"
          >
            <el-icon><Refresh /></el-icon>
            重置所有分配
          </el-button>
          <el-button 
            type="primary" 
            size="large"
            @click="handleAllocate"
            :loading="allocating"
            style="margin-left: 10px"
          >
            <el-icon><MagicStick /></el-icon>
            开始自动分配
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="department-card">
      <template #header>
        <div class="card-header">
          <el-icon><OfficeBuilding /></el-icon>
          部门管理
          <el-button 
            type="primary" 
            size="small" 
            style="margin-left: auto"
            @click="showAddDialog = true"
          >
            <el-icon><Plus /></el-icon>
            添加部门
          </el-button>
        </div>
      </template>

      <el-table :data="departmentsWithCount" style="width: 100%" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="部门名称" width="150" />
        <el-table-column label="人数容量" width="200">
          <template #default="scope">
            <el-progress 
              :percentage="getCapacityPercent(scope.row)"
              :color="getCapacityColor(scope.row)"
            >
              <template #default="{ percentage }">
                <span class="percentage-label">
                  {{ scope.row.assignedCount }}/{{ scope.row.maxCapacity }}
                </span>
              </template>
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column prop="interviewersPerSlot" label="每时段面试官" width="120" />
        <el-table-column label="可用时间段">
          <template #default="scope">
            <el-tag 
              v-for="slot in parseSlots(scope.row.availableSlots)" 
              :key="slot"
              style="margin: 2px"
              type="info"
              size="small"
            >
              {{ slot }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="添加部门" width="500px">
      <el-form :model="newDept" label-width="120px">
        <el-form-item label="部门名称">
          <el-input v-model="newDept.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="最大容量">
          <el-input-number v-model="newDept.maxCapacity" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="每时段面试官">
          <el-input-number v-model="newDept.interviewersPerSlot" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="可用时间段">
          <el-input 
            v-model="newDept.availableSlots" 
            type="textarea"
            :rows="3"
            placeholder="请输入可用时间段，用逗号分隔&#10;例如：周一9-12,周一14-17,周二9-12"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddDept" :loading="adding">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const allocating = ref(false)
const resetting = ref(false)
const adding = ref(false)
const departments = ref([])
const allApplicants = ref([])
const showAddDialog = ref(false)

const newDept = ref({
  name: '',
  maxCapacity: 15,
  interviewersPerSlot: 2,
  availableSlots: '周一9-12,周一14-17,周一19-21,周二9-12,周二14-17,周二19-21'
})

const stats = computed(() => ({
  totalApplicants: allApplicants.value.length,
  assignedCount: allApplicants.value.filter(a => a.assigned).length,
  unassignedCount: allApplicants.value.filter(a => !a.assigned).length,
  departmentCount: departments.value.length
}))

const departmentsWithCount = computed(() => {
  return departments.value.map(dept => {
    const assignedCount = allApplicants.value.filter(
      a => a.assignedDepartmentId === dept.id
    ).length
    return { ...dept, assignedCount }
  })
})

const fetchDepartments = async () => {
  try {
    const res = await request.get('/departments')
    departments.value = res.data
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

const fetchApplicants = async () => {
  try {
    const res = await request.get('/applicants')
    allApplicants.value = res.data
  } catch (error) {
    console.error('获取报名者列表失败:', error)
  }
}

const handleAllocate = async () => {
  if (stats.value.unassignedCount === 0) {
    ElMessage.info('没有待分配的报名者')
    return
  }

  allocating.value = true
  try {
    const res = await request.post('/applicants/allocate')
    const { assignedCount, remainingCount, totalApplicants } = res.data
    ElMessage.success(
      `分配完成！成功分配 ${assignedCount} 人，剩余 ${remainingCount} 人未分配`
    )
    await fetchApplicants()
  } catch (error) {
    console.error('分配失败:', error)
  } finally {
    allocating.value = false
  }
}

const handleReset = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有分配吗？此操作不可恢复！',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    resetting.value = true
    await request.delete('/applicants/allocations')
    ElMessage.success('已重置所有分配')
    await fetchApplicants()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置失败:', error)
    }
  } finally {
    resetting.value = false
  }
}

const handleAddDept = async () => {
  if (!newDept.value.name) {
    ElMessage.warning('请输入部门名称')
    return
  }

  adding.value = true
  try {
    await request.post('/departments', newDept.value)
    ElMessage.success('部门添加成功')
    showAddDialog.value = false
    newDept.value = {
      name: '',
      maxCapacity: 15,
      interviewersPerSlot: 2,
      availableSlots: '周一9-12,周一14-17,周一19-21,周二9-12,周二14-17,周二19-21'
    }
    await fetchDepartments()
  } catch (error) {
    console.error('添加部门失败:', error)
  } finally {
    adding.value = false
  }
}

const getCapacityPercent = (row) => {
  return Math.round((row.assignedCount / row.maxCapacity) * 100)
}

const getCapacityColor = (row) => {
  const percent = getCapacityPercent(row)
  if (percent >= 100) return '#f56c6c'
  if (percent >= 80) return '#e6a23c'
  return '#67c23a'
}

const parseSlots = (slotsStr) => {
  if (!slotsStr) return []
  return slotsStr.split(',')
}

onMounted(() => {
  fetchDepartments()
  fetchApplicants()
})
</script>

<style scoped>
.management-container {
  padding: 0;
}

.stats-card, .action-card, .department-card {
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

.action-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #909399;
  font-size: 14px;
}

.percentage-label {
  font-size: 13px;
  color: #606266;
}
</style>