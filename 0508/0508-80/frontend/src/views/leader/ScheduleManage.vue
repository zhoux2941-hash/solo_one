<template>
  <div class="schedule-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>排班管理</span>
          <el-button type="primary" @click="dialogVisible = true">
            <el-icon><Plus /></el-icon>
            新增排班
          </el-button>
        </div>
      </template>

      <el-form inline style="margin-bottom: 16px;">
        <el-form-item label="岗位">
          <el-select v-model="filterPositionId" placeholder="筛选岗位" style="width: 200px;" clearable>
            <el-option
              v-for="item in positions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filterDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
      </el-form>

      <el-table :data="filteredSchedules" stripe v-loading="loading">
        <el-table-column prop="volunteer.name" label="志愿者" width="100" />
        <el-table-column prop="position.name" label="岗位" width="180" />
        <el-table-column prop="scheduleDate" label="日期" width="120" />
        <el-table-column label="时间" width="150">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="ScheduleStatus[row.status]?.type">
              {{ getScheduleStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'PENDING'" 
              type="danger" 
              size="small"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增排班" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="志愿者" prop="volunteerId">
          <el-select v-model="form.volunteerId" placeholder="选择志愿者" style="width: 100%;" filterable>
            <el-option
              v-for="item in volunteers"
              :key="item.id"
              :label="`${item.name} (${item.phone || item.username})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位" prop="positionId">
          <el-select v-model="form.positionId" placeholder="选择岗位" style="width: 100%;">
            <el-option
              v-for="item in positions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="scheduleDate">
          <el-date-picker
            v-model="form.scheduleDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker
            v-model="form.startTime"
            placeholder="选择开始时间"
            format="HH:mm"
            value-format="HH:mm"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-time-picker
            v-model="form.endTime"
            placeholder="选择结束时间"
            format="HH:mm"
            value-format="HH:mm"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入地点" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="其他说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'
import { getScheduleStatusLabel, ScheduleStatus } from '@/utils/constants'

const route = useRoute()
const schedules = ref([])
const positions = ref([])
const volunteers = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const filterPositionId = ref('')
const filterDate = ref('')

const form = ref({
  volunteerId: '',
  positionId: '',
  applicationId: '',
  scheduleDate: '',
  startTime: '',
  endTime: '',
  location: '',
  notes: ''
})

const rules = {
  volunteerId: [{ required: true, message: '请选择志愿者', trigger: 'change' }],
  positionId: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  scheduleDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  location: [{ required: true, message: '请输入地点', trigger: 'blur' }]
}

const filteredSchedules = computed(() => {
  let result = schedules.value
  if (filterPositionId.value) {
    result = result.filter(s => s.position.id === filterPositionId.value)
  }
  if (filterDate.value) {
    result = result.filter(s => s.scheduleDate === filterDate.value)
  }
  return result
})

async function fetchData() {
  loading.value = true
  try {
    const [schedulesRes, positionsRes, volunteersRes] = await Promise.all([
      api.get('/leader/schedules'),
      api.get('/positions/list'),
      api.get('/leader/volunteers')
    ])

    if (schedulesRes.data.success) {
      schedules.value = schedulesRes.data.data
    }
    if (positionsRes.data.success) {
      positions.value = positionsRes.data.data
    }
    if (volunteersRes.data.success) {
      volunteers.value = volunteersRes.data.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const response = await api.post('/leader/schedule', form.value)
    if (response.data.success) {
      ElMessage.success('排班分配成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

function handleCancel(row) {
  ElMessageBox.confirm('确定要取消这个排班吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await api.post(`/leader/schedules/${row.id}/cancel`)
      if (response.data.success) {
        ElMessage.success('已取消')
        fetchData()
      } else {
        ElMessage.error(response.data.message)
      }
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

function resetForm() {
  form.value = {
    volunteerId: '',
    positionId: '',
    applicationId: '',
    scheduleDate: '',
    startTime: '',
    endTime: '',
    location: '',
    notes: ''
  }
}

watch(dialogVisible, (val) => {
  if (val) {
    resetForm()
    if (route.query.volunteerId) {
      form.value.volunteerId = Number(route.query.volunteerId)
    }
    if (route.query.positionId) {
      form.value.positionId = Number(route.query.positionId)
    }
    if (route.query.applicationId) {
      form.value.applicationId = Number(route.query.applicationId)
    }
  }
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
