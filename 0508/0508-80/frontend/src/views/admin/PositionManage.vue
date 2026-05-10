<template>
  <div class="position-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>岗位管理</span>
          <el-button type="primary" @click="dialogVisible = true">
            <el-icon><Plus /></el-icon>
            新增岗位
          </el-button>
        </div>
      </template>

      <el-table :data="positions" stripe v-loading="loading">
        <el-table-column prop="name" label="岗位名称" width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getPositionTypeTagType(row.type)">{{ getPositionTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="location" label="地点" width="150" />
        <el-table-column label="人数" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.min((row.currentCount / row.requiredCount) * 100, 100)" 
              :stroke-width="12"
              :format="() => `${row.currentCount}/${row.requiredCount}`"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="PositionStatus[row.status]?.type">
              {{ getPositionStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              v-if="row.status !== 'INACTIVE'" 
              type="danger" 
              size="small"
              @click="handleDelete(row)"
            >
              停用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑岗位' : '新增岗位'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="岗位名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item label="岗位类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择岗位类型" style="width: 100%;">
            <el-option
              v-for="item in positionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="需求人数" prop="requiredCount">
          <el-input-number v-model="form.requiredCount" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="岗位地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入岗位地点" />
        </el-form-item>
        <el-form-item label="岗位描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入岗位描述" />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'
import { 
  positionTypeOptions, 
  getPositionTypeLabel, 
  getPositionStatusLabel,
  PositionStatus
} from '@/utils/constants'

const positions = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const editId = ref(null)

const form = ref({
  name: '',
  type: '',
  requiredCount: 1,
  location: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择岗位类型', trigger: 'change' }],
  requiredCount: [{ required: true, message: '请输入需求人数', trigger: 'change' }],
  location: [{ required: true, message: '请输入岗位地点', trigger: 'blur' }]
}

function getPositionTypeTagType(type) {
  const types = {
    TICKET_CHECKING: 'primary',
    GUIDE: 'success',
    STAGE_ASSIST: 'warning',
    LOGISTICS: 'info',
    SECURITY: 'danger',
    FIRST_AID: 'success',
    OTHER: 'info'
  }
  return types[type] || 'info'
}

async function fetchPositions() {
  loading.value = true
  try {
    const response = await api.get('/positions/list')
    if (response.data.success) {
      positions.value = response.data.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    name: '',
    type: '',
    requiredCount: 1,
    location: '',
    description: ''
  }
  isEdit.value = false
  editId.value = null
}

function handleEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.value = {
    name: row.name,
    type: row.type,
    requiredCount: row.requiredCount,
    location: row.location,
    description: row.description || ''
  }
  dialogVisible.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要停用岗位「${row.name}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await api.delete(`/admin/position/${row.id}`)
      if (response.data.success) {
        ElMessage.success('已停用')
        fetchPositions()
      } else {
        ElMessage.error(response.data.message)
      }
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    let response
    if (isEdit.value) {
      response = await api.put(`/admin/position/${editId.value}`, form.value)
    } else {
      response = await api.post('/admin/position', form.value)
    }

    if (response.data.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchPositions()
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchPositions()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
