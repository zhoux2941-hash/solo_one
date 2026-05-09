<template>
  <div class="page-container">
    <div class="page-title">
      <span>🐶 宠物管理</span>
      <el-button type="primary" @click="handleAdd" class="ml-20">
        <el-icon><Plus /></el-icon>
        添加宠物
      </el-button>
    </div>

    <el-table :data="pets" v-loading="loading" stripe class="card-shadow">
      <el-table-column prop="name" label="宠物名称" width="120" />
      <el-table-column prop="type" label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="row.type === 'DOG' ? 'success' : 'warning'">
            {{ row.type === 'DOG' ? '狗' : '猫' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="size" label="体型" width="80">
        <template #default="{ row }">
          {{ sizeMap[row.size] }}
        </template>
      </el-table-column>
      <el-table-column prop="breed" label="品种" width="100" />
      <el-table-column prop="age" label="年龄" width="80">
        <template #default="{ row }">
          {{ row.age ? row.age + '岁' : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="specialNeeds" label="特殊需求" min-width="200">
        <template #default="{ row }">
          {{ row.specialNeeds || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑宠物' : '添加宠物'"
      width="500px"
    >
      <el-form :model="petForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="宠物名称" prop="name">
          <el-input v-model="petForm.name" placeholder="请输入宠物名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="petForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="狗" value="DOG" />
            <el-option label="猫" value="CAT" />
          </el-select>
        </el-form-item>
        <el-form-item label="体型" prop="size">
          <el-select v-model="petForm.size" placeholder="请选择体型" style="width: 100%">
            <el-option label="小型" value="SMALL" />
            <el-option label="中型" value="MEDIUM" />
            <el-option label="大型" value="LARGE" />
          </el-select>
        </el-form-item>
        <el-form-item label="品种">
          <el-input v-model="petForm.breed" placeholder="请输入品种" />
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="petForm.age" :min="0" :max="30" />
        </el-form-item>
        <el-form-item label="特殊需求">
          <el-input
            v-model="petForm.specialNeeds"
            type="textarea"
            :rows="3"
            placeholder="如：需要大空间、怕猫、怕热等"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { petApi } from '@/api'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const pets = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const sizeMap = {
  SMALL: '小型',
  MEDIUM: '中型',
  LARGE: '大型'
}

const petForm = reactive({
  petId: null,
  ownerId: 1,
  name: '',
  type: 'DOG',
  size: 'SMALL',
  breed: '',
  age: null,
  specialNeeds: ''
})

const rules = {
  name: [{ required: true, message: '请输入宠物名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  size: [{ required: true, message: '请选择体型', trigger: 'change' }]
}

const loadPets = async () => {
  loading.value = true
  try {
    pets.value = await petApi.getByOwner(appStore.currentOwnerId)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(petForm, {
    petId: null,
    ownerId: appStore.currentOwnerId,
    name: '',
    type: 'DOG',
    size: 'SMALL',
    breed: '',
    age: null,
    specialNeeds: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(petForm, row)
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除宠物"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await petApi.delete(row.petId)
    ElMessage.success('删除成功')
    loadPets()
  }).catch(() => {})
}

const handleSubmit = async () => {
  await formRef.value.validate()
  
  if (isEdit.value) {
    await petApi.update(petForm.petId, petForm)
    ElMessage.success('更新成功')
  } else {
    await petApi.create(petForm)
    ElMessage.success('添加成功')
  }
  
  dialogVisible.value = false
  loadPets()
}

onMounted(() => {
  loadPets()
})
</script>

<style scoped>
.ml-20 {
  margin-left: 20px;
}

.page-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
