<template>
  <div class="leader-applications">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>申请审核</span>
          <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 140px;" clearable>
            <el-option
              v-for="item in applicationStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </template>

      <el-table :data="filteredApplications" stripe v-loading="loading">
        <el-table-column prop="user.name" label="志愿者姓名" width="120" />
        <el-table-column prop="user.phone" label="联系电话" width="140" />
        <el-table-column prop="position.name" label="申请岗位" width="180" />
        <el-table-column prop="position.type" label="岗位类型" width="100">
          <template #default="{ row }">
            {{ getPositionTypeLabel(row.position.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="preferredTime" label="期望时间" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="ApplicationStatus[row.status]?.type">
              {{ getApplicationStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'PENDING'" 
              type="success" 
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.status === 'PENDING'" 
              type="danger" 
              size="small"
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
            <el-button 
              v-if="row.status === 'APPROVED'" 
              type="primary" 
              size="small"
              @click="goToSchedule(row)"
            >
              分配排班
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'
import { 
  applicationStatusOptions, 
  getPositionTypeLabel, 
  getApplicationStatusLabel,
  ApplicationStatus
} from '@/utils/constants'
import dayjs from 'dayjs'

const router = useRouter()
const applications = ref([])
const loading = ref(false)
const filterStatus = ref('')

const filteredApplications = computed(() => {
  if (!filterStatus.value) return applications.value
  return applications.value.filter(a => a.status === filterStatus.value)
})

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function fetchApplications() {
  loading.value = true
  try {
    const response = await api.get('/leader/applications')
    if (response.data.success) {
      applications.value = response.data.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleApprove(row) {
  try {
    const response = await api.post(`/leader/applications/${row.id}/approve`)
    if (response.data.success) {
      ElMessage.success('审核通过')
      fetchApplications()
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (e) {
    console.error(e)
  }
}

function handleReject(row) {
  ElMessageBox.prompt('请输入拒绝原因', '拒绝申请', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '请输入拒绝原因'
  }).then(async ({ value }) => {
    try {
      const response = await api.post(`/leader/applications/${row.id}/reject?reason=${encodeURIComponent(value)}`)
      if (response.data.success) {
        ElMessage.success('已拒绝')
        fetchApplications()
      } else {
        ElMessage.error(response.data.message)
      }
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

function goToSchedule(row) {
  router.push({
    path: '/leader/schedules',
    query: {
      applicationId: row.id,
      volunteerId: row.user.id,
      positionId: row.position.id
    }
  })
}

onMounted(() => {
  fetchApplications()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
