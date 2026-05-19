<template>
  <div class="approval-pending">
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>待我审批</span>
        </div>
      </template>

      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="类型">
            <el-select v-model="searchForm.processType" placeholder="申请类型" clearable style="width: 150px">
              <el-option label="领用" :value="1" />
              <el-option label="归还" :value="2" />
              <el-option label="调拨" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="fetchList">搜索</el-button>
            <el-button icon="Refresh" @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border v-loading="loading" style="width: 100%">
        <el-table-column prop="processNo" label="流程编号" width="180" />
        <el-table-column prop="processType" label="申请类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ getTypeName(row.processType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="equipmentName" label="装备名称" width="150" />
        <el-table-column prop="equipmentRfid" label="RFID编号" width="150" />
        <el-table-column prop="applicantName" label="申请人" width="100" />
        <el-table-column prop="applyReason" label="申请原因" show-overflow-tooltip />
        <el-table-column prop="currentStep" label="当前步骤" width="120">
          <template #default="{ row }">
            <el-tag type="info" v-if="row.currentStep === 1">库管审批</el-tag>
            <el-tag type="warning" v-else-if="row.currentStep === 2">涉密审核</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="handleAudit(row, 1)">通过</el-button>
            <el-button type="danger" link size="small" @click="handleAudit(row, 0)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>

    <el-dialog v-model="auditDialogVisible" title="审批" width="500px">
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审批结果">
          <el-radio-group v-model="auditForm.result">
            <el-radio :value="1" style="color: #67C23A">通过</el-radio>
            <el-radio :value="0" style="color: #F56C6C">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="auditForm.remark" type="textarea" :rows="3" placeholder="请输入审批意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitAudit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPendingApprovalList, auditApproval } from '@/api/approval'

const loading = ref(false)
const submitLoading = ref(false)
const auditDialogVisible = ref(false)

const searchForm = ref({
  processType: null
})

const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

const auditForm = ref({
  id: null,
  result: 1,
  remark: ''
})

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm.value,
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    }
    const res = await getPendingApprovalList(params)
    tableData.value = res.data.records
    pagination.value.total = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.value = {
    processType: null
  }
  fetchList()
}

const handleAudit = (row, result) => {
  auditForm.value = {
    id: row.id,
    result: result,
    remark: ''
  }
  auditDialogVisible.value = true
}

const handleSubmitAudit = async () => {
  submitLoading.value = true
  try {
    await auditApproval(auditForm.value)
    ElMessage.success('审批成功')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error(error)
  } finally {
    submitLoading.value = false
  }
}

const getTypeName = (type) => {
  const map = { 1: '领用', 2: '归还', 3: '调拨' }
  return map[type] || '-'
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.approval-pending {
  padding: 10px 0;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 5px;
}
</style>
