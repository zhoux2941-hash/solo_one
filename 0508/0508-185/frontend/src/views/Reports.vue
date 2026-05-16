<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>奖金报表查询</span>
      </template>
      <el-form :inline="true" :model="queryForm" label-width="80px">
        <el-form-item label="年份">
          <el-input-number v-model="queryForm.year" :min="2020" style="width: 150px" />
        </el-form-item>
        <el-form-item label="季度">
          <el-select v-model="queryForm.quarter" style="width: 150px">
            <el-option label="Q1" :value="1" />
            <el-option label="Q2" :value="2" />
            <el-option label="Q3" :value="3" />
            <el-option label="Q4" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryReports">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="reports" border>
      <el-table-column prop="departmentName" label="部门名称" width="150" />
      <el-table-column prop="quarterYear" label="年份" width="100" />
      <el-table-column prop="quarterNumber" label="季度" width="80">
        <template #default="{ row }">Q{{ row.quarterNumber }}</template>
      </el-table-column>
      <el-table-column prop="totalBonus" label="总奖金" width="150">
        <template #default="{ row }">
          <strong style="color: #409EFF">¥{{ row.totalBonus?.toLocaleString() || 0 }}</strong>
        </template>
      </el-table-column>
      <el-table-column prop="employeeCount" label="员工人数" width="120" />
      <el-table-column prop="avgBonus" label="人均奖金" width="150">
        <template #default="{ row }">
          ¥{{ row.avgBonus?.toLocaleString() || 0 }}
        </template>
      </el-table-column>
      <el-table-column prop="generatedAt" label="生成时间" width="180" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button type="primary" link @click="showDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="detailDialogVisible" title="报表详情" width="800px">
      <el-descriptions v-if="currentReport" border style="margin-bottom: 20px">
        <el-descriptions-item label="部门">{{ currentReport.departmentName }}</el-descriptions-item>
        <el-descriptions-item label="季度">{{ currentReport.quarterYear }}年Q{{ currentReport.quarterNumber }}</el-descriptions-item>
        <el-descriptions-item label="总奖金">¥{{ currentReport.totalBonus?.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="员工人数">{{ currentReport.employeeCount }}</el-descriptions-item>
        <el-descriptions-item label="人均奖金">¥{{ currentReport.avgBonus?.toLocaleString() }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="allocations.length > 0" style="max-height: 400px; overflow-y: auto">
        <h4 style="margin-bottom: 10px">员工分配明细</h4>
        <el-table :data="allocations" border size="small">
          <el-table-column prop="employeeName" label="员工姓名" width="150" />
          <el-table-column prop="percentage" label="比例(%)" width="120" />
          <el-table-column prop="amount" label="奖金" width="150">
            <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import reportApi from '@/api/report'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const reports = ref([])
const detailDialogVisible = ref(false)
const currentReport = ref(null)
const allocations = ref([])
const queryForm = ref({
  year: new Date().getFullYear(),
  quarter: Math.floor((new Date().getMonth() + 3) / 3)
})

const statusText = (status) => {
  const texts = { DRAFT: '草稿', CONFIRMED: '已确认', APPEALED: '已申诉', ADJUSTED: '已调整' }
  return texts[status] || status
}

const queryReports = async () => {
  try {
    const deptId = userStore.currentUser?.departmentId
    if (!deptId) {
      ElMessage.error('当前用户没有分配部门')
      return
    }
    const response = await reportApi.getByQuarter(deptId, queryForm.value.year, queryForm.value.quarter)
    if (response.data) {
      reports.value = [response.data]
    } else {
      reports.value = []
      ElMessage.info('暂无报表数据')
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '查询失败'
    ElMessage.error(errorMsg)
  }
}

const showDetail = (report) => {
  currentReport.value = report
  try {
    const reportData = JSON.parse(report.reportData)
    allocations.value = reportData.allocations || []
  } catch {
    allocations.value = []
  }
  detailDialogVisible.value = true
}

onMounted(() => {
  queryReports()
})
</script>
