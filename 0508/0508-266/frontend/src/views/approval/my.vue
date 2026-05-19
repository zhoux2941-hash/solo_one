<template>
  <div class="approval-my">
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>我的申请</span>
          <el-button type="primary" icon="Plus" @click="handleApply">新增申请</el-button>
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
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="审批状态" clearable style="width: 150px">
              <el-option label="审批中" :value="0" />
              <el-option label="已通过" :value="1" />
              <el-option label="已驳回" :value="2" />
              <el-option label="已撤回" :value="3" />
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
        <el-table-column prop="applyReason" label="申请原因" show-overflow-tooltip />
        <el-table-column prop="currentStep" label="当前步骤" width="100">
          <template #default="{ row }">
            <el-tag type="info" v-if="row.currentStep === 1">库管审批</el-tag>
            <el-tag type="warning" v-else-if="row.currentStep === 2">涉密审核</el-tag>
            <el-tag type="success" v-else>已完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="processStatus" label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.processStatus)">{{ getStatusName(row.processStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
            <el-button type="warning" link size="small" @click="handleWithdraw(row)" v-if="row.processStatus === 0">
              撤回
            </el-button>
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

    <el-dialog v-model="applyDialogVisible" title="提交申请" width="600px">
      <el-form :model="applyForm" label-width="100px">
        <el-form-item label="装备" prop="equipmentId">
          <el-select v-model="applyForm.equipmentId" placeholder="请选择装备" style="width: 100%" filterable>
            <el-option
              v-for="item in equipmentList"
              :key="item.id"
              :label="`${item.equipmentName} (${item.rfidCode})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申请类型" prop="processType">
          <el-select v-model="applyForm.processType" placeholder="请选择类型" style="width: 100%">
            <el-option label="领用" :value="1" />
            <el-option label="归还" :value="2" />
            <el-option label="调拨" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请原因" prop="applyReason">
          <el-input v-model="applyForm.applyReason" type="textarea" :rows="3" placeholder="请输入申请原因" />
        </el-form-item>
        <el-form-item label="预计归还日期" prop="expectReturnDate" v-if="applyForm.processType === 1">
          <el-date-picker v-model="applyForm.expectReturnDate" type="date" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitApply">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="申请详情" width="700px">
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="流程编号">{{ currentDetail.processNo }}</el-descriptions-item>
        <el-descriptions-item label="申请类型">{{ getTypeName(currentDetail.processType) }}</el-descriptions-item>
        <el-descriptions-item label="装备名称">{{ currentDetail.equipmentName }}</el-descriptions-item>
        <el-descriptions-item label="RFID编号">{{ currentDetail.equipmentRfid }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentDetail.applicantName }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ currentDetail.applyTime }}</el-descriptions-item>
        <el-descriptions-item label="申请原因" :span="2">{{ currentDetail.applyReason }}</el-descriptions-item>
        <el-descriptions-item label="审批状态" :span="2">
          <el-tag :type="getStatusType(currentDetail.processStatus)">{{ getStatusName(currentDetail.processStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="库管审批" v-if="currentDetail.warehouseKeeperName" :span="2">
          <div>审批人：{{ currentDetail.warehouseKeeperName }}</div>
          <div>审批时间：{{ currentDetail.warehouseKeeperTime }}</div>
          <div v-if="currentDetail.warehouseKeeperRemark">审批意见：{{ currentDetail.warehouseKeeperRemark }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="涉密审核" v-if="currentDetail.auditorName" :span="2">
          <div>审批人：{{ currentDetail.auditorName }}</div>
          <div>审批时间：{{ currentDetail.auditorTime }}</div>
          <div v-if="currentDetail.auditorRemark">审批意见：{{ currentDetail.auditorRemark }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyApprovalList, applyApproval, withdrawApproval } from '@/api/approval'
import { getEquipmentList } from '@/api/equipment'

const loading = ref(false)
const submitLoading = ref(false)
const applyDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentDetail = ref(null)

const searchForm = ref({
  processType: null,
  status: null
})

const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const equipmentList = ref([])

const applyForm = ref({
  equipmentId: null,
  processType: 1,
  applyReason: '',
  expectReturnDate: null
})

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm.value,
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    }
    const res = await getMyApprovalList(params)
    tableData.value = res.data.records
    pagination.value.total = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchEquipmentList = async () => {
  const res = await getEquipmentList({ pageNum: 1, pageSize: 100, status: 1 })
  equipmentList.value = res.data.records
}

const resetSearch = () => {
  searchForm.value = {
    processType: null,
    status: null
  }
  fetchList()
}

const handleApply = () => {
  fetchEquipmentList()
  applyForm.value = {
    equipmentId: null,
    processType: 1,
    applyReason: '',
    expectReturnDate: null
  }
  applyDialogVisible.value = true
}

const handleSubmitApply = async () => {
  if (!applyForm.value.equipmentId || !applyForm.value.applyReason) {
    ElMessage.warning('请填写必填项')
    return
  }
  submitLoading.value = true
  try {
    await applyApproval(applyForm.value)
    ElMessage.success('申请提交成功')
    applyDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error(error)
  } finally {
    submitLoading.value = false
  }
}

const handleDetail = (row) => {
  currentDetail.value = row
  detailDialogVisible.value = true
}

const handleWithdraw = (row) => {
  ElMessageBox.confirm('确定要撤回该申请吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await withdrawApproval(row.id)
    ElMessage.success('撤回成功')
    fetchList()
  })
}

const getTypeName = (type) => {
  const map = { 1: '领用', 2: '归还', 3: '调拨' }
  return map[type] || '-'
}

const getStatusName = (status) => {
  const map = { 0: '审批中', 1: '已通过', 2: '已驳回', 3: '已撤回' }
  return map[status] || '-'
}

const getStatusType = (status) => {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] || ''
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.approval-my {
  padding: 10px 0;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 5px;
}
</style>
