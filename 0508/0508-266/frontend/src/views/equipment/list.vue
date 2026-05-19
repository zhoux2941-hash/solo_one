<template>
  <div class="equipment-list">
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>装备台账</span>
          <div style="display: flex; gap: 10px">
            <el-button type="primary" icon="Plus" @click="handleAdd" v-if="['ADMIN', 'WAREHOUSE_KEEPER'].includes(userStore.roleCode)">
              新增装备
            </el-button>
            <el-button type="success" icon="Download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="关键词">
            <el-input v-model="searchForm.keyword" placeholder="装备名称/RFID" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="装备状态" clearable style="width: 150px">
              <el-option label="在库" :value="1" />
              <el-option label="领用中" :value="2" />
              <el-option label="维修中" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="密级">
            <el-select v-model="searchForm.secretLevel" placeholder="涉密等级" clearable style="width: 150px">
              <el-option label="非密" :value="0" />
              <el-option label="秘密" :value="1" />
              <el-option label="机密" :value="2" />
              <el-option label="绝密" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="fetchList">搜索</el-button>
            <el-button icon="Refresh" @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border v-loading="loading" style="width: 100%">
        <el-table-column prop="rfidCode" label="RFID编号" width="150" />
        <el-table-column prop="equipmentName" label="装备名称" width="180" />
        <el-table-column prop="equipmentModel" label="型号" width="150" />
        <el-table-column prop="equipmentType" label="类型" width="120" />
        <el-table-column prop="secretLevel" label="密级" width="100">
          <template #default="{ row }">
            <el-tag :type="getSecretLevelType(row.secretLevel)">{{ getSecretLevelName(row.secretLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="equipmentStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.equipmentStatus)">{{ getStatusName(row.equipmentStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouseLocation" label="存放位置" width="150" />
        <el-table-column prop="currentUserName" label="当前持有人" width="120" />
        <el-table-column prop="createdTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleApply(row)" v-if="['OPERATOR', 'ADMIN'].includes(userStore.roleCode)">
              领用
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)" v-if="['ADMIN', 'WAREHOUSE_KEEPER'].includes(userStore.roleCode)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)" v-if="['ADMIN'].includes(userStore.roleCode)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="RFID编号" prop="rfidCode">
          <el-input v-model="form.rfidCode" />
        </el-form-item>
        <el-form-item label="装备名称" prop="equipmentName">
          <el-input v-model="form.equipmentName" />
        </el-form-item>
        <el-form-item label="型号" prop="equipmentModel">
          <el-input v-model="form.equipmentModel" />
        </el-form-item>
        <el-form-item label="类型" prop="equipmentType">
          <el-input v-model="form.equipmentType" />
        </el-form-item>
        <el-form-item label="密级" prop="secretLevel">
          <el-select v-model="form.secretLevel" style="width: 100%">
            <el-option label="非密" :value="0" />
            <el-option label="秘密" :value="1" />
            <el-option label="机密" :value="2" />
            <el-option label="绝密" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="存放位置" prop="warehouseLocation">
          <el-input v-model="form.warehouseLocation" />
        </el-form-item>
        <el-form-item label="生产厂家" prop="manufacturer">
          <el-input v-model="form.manufacturer" />
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEquipmentList, addEquipment, updateEquipment, deleteEquipment } from '@/api/equipment'

const userStore = useUserStore()

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const searchForm = ref({
  keyword: '',
  status: null,
  secretLevel: null
})

const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

const form = ref({
  id: null,
  rfidCode: '',
  equipmentName: '',
  equipmentModel: '',
  equipmentType: '',
  secretLevel: 0,
  warehouseLocation: '',
  manufacturer: '',
  description: ''
})

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm.value,
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    }
    const res = await getEquipmentList(params)
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
    keyword: '',
    status: null,
    secretLevel: null
  }
  fetchList()
}

const handleAdd = () => {
  dialogTitle.value = '新增装备'
  isEdit.value = false
  form.value = {
    id: null,
    rfidCode: '',
    equipmentName: '',
    equipmentModel: '',
    equipmentType: '',
    secretLevel: 0,
    warehouseLocation: '',
    manufacturer: '',
    description: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑装备'
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该装备吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteEquipment(row.id)
    ElMessage.success('删除成功')
    fetchList()
  })
}

const handleApply = (row) => {
  ElMessage.info('请前往审批管理提交领用申请')
}

const handleSubmit = async () => {
  if (!form.value.rfidCode || !form.value.equipmentName) {
    ElMessage.warning('请填写必填项')
    return
  }
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateEquipment(form.value)
      ElMessage.success('更新成功')
    } else {
      await addEquipment(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error(error)
  } finally {
    submitLoading.value = false
  }
}

const handleExport = () => {
  ElMessage.success('导出功能开发中')
}

const getSecretLevelName = (level) => {
  const map = { 0: '非密', 1: '秘密', 2: '机密', 3: '绝密' }
  return map[level] || '-'
}

const getSecretLevelType = (level) => {
  const map = { 0: '', 1: 'warning', 2: 'danger', 3: 'info' }
  return map[level] || ''
}

const getStatusName = (status) => {
  const map = { 1: '在库', 2: '领用中', 3: '维修中' }
  return map[status] || '-'
}

const getStatusType = (status) => {
  const map = { 1: 'success', 2: 'warning', 3: 'info' }
  return map[status] || ''
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.equipment-list {
  padding: 10px 0;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 5px;
}
</style>
