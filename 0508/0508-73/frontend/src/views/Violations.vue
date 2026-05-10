<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">违规记录（超期未归）</h2>
      <el-button type="primary" @click="loadApplications">刷新</el-button>
    </div>

    <el-alert 
      type="warning" 
      :closable="false"
      style="margin-bottom: 20px;"
    >
      以下是当前超期未归还的危化品领用申请，请及时督促实验员归还
    </el-alert>

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
      <el-table-column prop="quantity" label="数量" width="120">
        <template #default="scope">
          {{ scope.row.quantity }} {{ scope.row.chemical.unit }}
        </template>
      </el-table-column>
      <el-table-column label="超期天数" width="100">
        <template #default="scope">
          <span class="stock-warning">{{ getOverdueDays(scope.row.plannedReturnDate) }}天</span>
        </template>
      </el-table-column>
      <el-table-column prop="plannedReturnDate" label="计划归还日期" width="140" />
      <el-table-column prop="expectedDate" label="预计使用日期" width="140" />
      <el-table-column prop="createdAt" label="申请时间" width="180" />
      <el-table-column label="超期原因" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.overdueReason || '未填写' }}
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && applications.length === 0" description="暂无违规记录" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOverdueApplications } from '../api/application'

const applications = ref([])
const loading = ref(false)

const getDangerLevelName = (level) => {
  const map = { HIGH: '高', MEDIUM: '中', LOW: '低' }
  return map[level] || level
}

const getDangerTagType = (level) => {
  const map = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' }
  return map[level] || 'info'
}

const getOverdueDays = (plannedReturnDate) => {
  if (!plannedReturnDate) return 0
  const today = new Date()
  const planned = new Date(plannedReturnDate)
  const diffTime = today.getTime() - planned.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

const loadApplications = async () => {
  loading.value = true
  try {
    applications.value = await getOverdueApplications()
  } catch (error) {
    console.error('Failed to load applications:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadApplications()
})
</script>
