<template>
  <div class="my-schedules">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的排班</span>
          <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 140px;" clearable>
            <el-option label="待签到" value="PENDING" />
            <el-option label="已签到" value="CHECKED_IN" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </div>
      </template>

      <el-empty v-if="filteredSchedules.length === 0" description="暂无排班" />

      <el-table :data="filteredSchedules" stripe v-loading="loading" v-else>
        <el-table-column prop="position.name" label="岗位名称" width="180" />
        <el-table-column prop="position.type" label="岗位类型" width="100">
          <template #default="{ row }">
            {{ getPositionTypeLabel(row.position.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="scheduleDate" label="日期" width="120" />
        <el-table-column label="时间" width="150">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="ScheduleStatus[row.status]?.type">
              {{ getScheduleStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'PENDING'" 
              type="primary" 
              size="small"
              @click="goToCheckIn(row.id)"
            >
              签到
            </el-button>
            <el-button 
              v-else-if="row.status === 'CHECKED_IN'" 
              type="success" 
              size="small"
              disabled
            >
              已签到
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
import api from '@/utils/api'
import { 
  getPositionTypeLabel, 
  getScheduleStatusLabel,
  ScheduleStatus
} from '@/utils/constants'

const router = useRouter()
const schedules = ref([])
const loading = ref(false)
const filterStatus = ref('')

const filteredSchedules = computed(() => {
  if (!filterStatus.value) return schedules.value
  return schedules.value.filter(s => s.status === filterStatus.value)
})

function goToCheckIn(scheduleId) {
  router.push(`/checkin/${scheduleId}`)
}

async function fetchSchedules() {
  loading.value = true
  try {
    const response = await api.get('/volunteer/schedules')
    if (response.data.success) {
      schedules.value = response.data.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSchedules()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
