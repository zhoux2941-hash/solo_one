<template>
  <div class="my-applications">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的申请</span>
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
        <el-table-column prop="position.name" label="岗位名称" width="200" />
        <el-table-column prop="position.type" label="岗位类型" width="120">
          <template #default="{ row }">
            {{ getPositionTypeLabel(row.position.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="position.location" label="岗位地点" width="200" />
        <el-table-column prop="preferredTime" label="期望时间" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="ApplicationStatus[row.status]?.type">
              {{ getApplicationStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'
import { 
  applicationStatusOptions, 
  getPositionTypeLabel, 
  getApplicationStatusLabel,
  ApplicationStatus
} from '@/utils/constants'
import dayjs from 'dayjs'

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
    const response = await api.get('/volunteer/applications')
    if (response.data.success) {
      applications.value = response.data.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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
