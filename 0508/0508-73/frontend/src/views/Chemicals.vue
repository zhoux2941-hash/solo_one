<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">化学品库存</h2>
      <el-button 
        v-if="currentUser?.role === 'DIRECTOR'" 
        type="primary" 
        @click="handleAdd"
      >
        <el-icon><Plus /></el-icon>
        添加化学品
      </el-button>
    </div>

    <el-table :data="chemicals" style="width: 100%" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="casNumber" label="CAS号" />
      <el-table-column prop="currentStock" label="当前库存">
        <template #default="scope">
          <span :class="isStockWarning(scope.row) ? 'stock-warning' : 'stock-normal'">
            {{ scope.row.currentStock }} {{ scope.row.unit }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="dangerLevel" label="危险等级">
        <template #default="scope">
          <el-tag :type="getDangerTagType(scope.row.dangerLevel)">
            {{ getDangerLevelName(scope.row.dangerLevel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" v-if="currentUser?.role === 'LAB_TECHNICIAN'">
        <template #default="scope">
          <el-button 
            type="primary" 
            size="small" 
            :disabled="isStockWarning(scope.row)"
            @click="handleApply(scope.row)"
          >
            申请领用
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" v-if="currentUser?.role === 'DIRECTOR'">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="applyDialogVisible" title="申请领用化学品" width="500px">
      <el-form :model="applyForm" :rules="applyRules" ref="applyFormRef" label-width="100px">
        <el-form-item label="化学品">
          <el-input :value="selectedChemical?.name" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="`${selectedChemical?.currentStock} ${selectedChemical?.unit}`" disabled />
        </el-form-item>
        <el-form-item label="领用数量" prop="quantity">
          <el-input-number 
            v-model="applyForm.quantity" 
            :min="0.1" 
            :max="selectedChemical?.currentStock" 
            :precision="2" 
            :step="0.1"
            style="width: 100%"
          />
          <span style="margin-left: 10px">{{ selectedChemical?.unit }}</span>
        </el-form-item>
        <el-form-item label="用途" prop="purpose">
          <el-input v-model="applyForm.purpose" type="textarea" :rows="3" placeholder="请输入使用用途" />
        </el-form-item>
        <el-form-item label="预计使用日期" prop="expectedDate">
          <el-date-picker
            v-model="applyForm.expectedDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            :disabled-date="disabledExpectedDate"
          />
        </el-form-item>
        <el-form-item label="计划归还日期" prop="plannedReturnDate">
          <el-date-picker
            v-model="applyForm.plannedReturnDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            :disabled-date="disabledReturnDate"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApplication" :loading="applyLoading">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" :title="isEdit ? '编辑化学品' : '添加化学品'" width="500px">
      <el-form :model="chemicalForm" :rules="chemicalRules" ref="chemicalFormRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="chemicalForm.name" placeholder="请输入化学品名称" />
        </el-form-item>
        <el-form-item label="CAS号" prop="casNumber">
          <el-input v-model="chemicalForm.casNumber" placeholder="请输入CAS号" />
        </el-form-item>
        <el-form-item label="库存量" prop="currentStock">
          <el-input-number v-model="chemicalForm.currentStock" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-select v-model="chemicalForm.unit" placeholder="请选择单位" style="width: 100%">
            <el-option label="g" value="g" />
            <el-option label="mL" value="mL" />
          </el-select>
        </el-form-item>
        <el-form-item label="危险等级" prop="dangerLevel">
          <el-select v-model="chemicalForm.dangerLevel" placeholder="请选择危险等级" style="width: 100%">
            <el-option label="高" value="HIGH" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="低" value="LOW" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveChemical" :loading="editLoading">{{ isEdit ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getChemicals, createChemical, updateChemical } from '../api/chemical'
import { createApplication } from '../api/application'

const currentUser = ref(null)
const chemicals = ref([])
const loading = ref(false)

const applyDialogVisible = ref(false)
const applyLoading = ref(false)
const applyFormRef = ref(null)
const selectedChemical = ref(null)
const applyForm = reactive({
  quantity: null,
  purpose: '',
  expectedDate: null,
  plannedReturnDate: null
})
const applyRules = {
  quantity: [{ required: true, message: '请输入领用数量', trigger: 'change' }],
  purpose: [{ required: true, message: '请输入用途', trigger: 'blur' }],
  expectedDate: [{ required: true, message: '请选择预计使用日期', trigger: 'change' }],
  plannedReturnDate: [{ required: true, message: '请选择计划归还日期', trigger: 'change' }]
}

const editDialogVisible = ref(false)
const editLoading = ref(false)
const chemicalFormRef = ref(null)
const isEdit = ref(false)
const chemicalForm = reactive({
  id: null,
  name: '',
  casNumber: '',
  currentStock: 0,
  unit: 'g',
  dangerLevel: 'MEDIUM'
})
const chemicalRules = {
  name: [{ required: true, message: '请输入化学品名称', trigger: 'blur' }],
  casNumber: [{ required: true, message: '请输入CAS号', trigger: 'blur' }],
  currentStock: [{ required: true, message: '请输入库存量', trigger: 'change' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }],
  dangerLevel: [{ required: true, message: '请选择危险等级', trigger: 'change' }]
}

const STOCK_THRESHOLD = 100

const isStockWarning = (chemical) => {
  return chemical.currentStock < STOCK_THRESHOLD
}

const getDangerLevelName = (level) => {
  const map = { HIGH: '高', MEDIUM: '中', LOW: '低' }
  return map[level] || level
}

const getDangerTagType = (level) => {
  const map = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' }
  return map[level] || 'info'
}

const loadChemicals = async () => {
  loading.value = true
  try {
    chemicals.value = await getChemicals()
  } catch (error) {
    console.error('Failed to load chemicals:', error)
  } finally {
    loading.value = false
  }
}

const disabledExpectedDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7
}

const disabledReturnDate = (time) => {
  if (!applyForm.expectedDate) {
    return time.getTime() < Date.now() - 8.64e7
  }
  const expectedTime = new Date(applyForm.expectedDate).getTime()
  return time.getTime() < expectedTime
}

const handleApply = (chemical) => {
  selectedChemical.value = chemical
  applyForm.quantity = null
  applyForm.purpose = ''
  applyForm.expectedDate = null
  applyForm.plannedReturnDate = null
  applyDialogVisible.value = true
}

const submitApplication = async () => {
  if (!applyFormRef.value) return
  await applyFormRef.value.validate()
  
  applyLoading.value = true
  try {
    await createApplication({
      chemicalId: selectedChemical.value.id,
      quantity: applyForm.quantity,
      purpose: applyForm.purpose,
      expectedDate: applyForm.expectedDate,
      plannedReturnDate: applyForm.plannedReturnDate
    })
    ElMessage.success('申请提交成功')
    applyDialogVisible.value = false
    loadChemicals()
  } catch (error) {
    console.error('Failed to create application:', error)
  } finally {
    applyLoading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  chemicalForm.id = null
  chemicalForm.name = ''
  chemicalForm.casNumber = ''
  chemicalForm.currentStock = 0
  chemicalForm.unit = 'g'
  chemicalForm.dangerLevel = 'MEDIUM'
  editDialogVisible.value = true
}

const handleEdit = (chemical) => {
  isEdit.value = true
  chemicalForm.id = chemical.id
  chemicalForm.name = chemical.name
  chemicalForm.casNumber = chemical.casNumber
  chemicalForm.currentStock = chemical.currentStock
  chemicalForm.unit = chemical.unit
  chemicalForm.dangerLevel = chemical.dangerLevel
  editDialogVisible.value = true
}

const saveChemical = async () => {
  if (!chemicalFormRef.value) return
  await chemicalFormRef.value.validate()
  
  editLoading.value = true
  try {
    if (isEdit.value) {
      await updateChemical(chemicalForm.id, chemicalForm)
      ElMessage.success('化学品信息已更新')
    } else {
      await createChemical(chemicalForm)
      ElMessage.success('化学品已添加')
    }
    editDialogVisible.value = false
    loadChemicals()
  } catch (error) {
    console.error('Failed to save chemical:', error)
  } finally {
    editLoading.value = false
  }
}

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
  }
  loadChemicals()
})
</script>
