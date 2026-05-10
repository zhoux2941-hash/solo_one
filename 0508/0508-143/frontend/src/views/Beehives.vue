<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>蜂箱列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加蜂箱
          </el-button>
        </div>
      </template>

      <el-table :data="beehives" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="hiveNumber" label="蜂箱编号" width="150" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="createdAt" label="创建时间" width="200">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑蜂箱' : '添加蜂箱'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="蜂箱编号" prop="hiveNumber">
          <el-input v-model="form.hiveNumber" placeholder="请输入蜂箱编号" />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="form.location" placeholder="请输入位置" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="请输入描述" />
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
import { getBeehives, createBeehive, updateBeehive, deleteBeehive } from '@/api/beehive'

const beehives = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  hiveNumber: '',
  location: '',
  description: ''
})

const rules = {
  hiveNumber: [{ required: true, message: '请输入蜂箱编号', trigger: 'blur' }]
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadBeehives() {
  try {
    beehives.value = await getBeehives()
  } catch (error) {
    console.error('加载蜂箱列表失败', error)
  }
}

function handleAdd() {
  isEdit.value = false
  form.id = null
  form.hiveNumber = ''
  form.location = ''
  form.description = ''
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  form.id = row.id
  form.hiveNumber = row.hiveNumber
  form.location = row.location || ''
  form.description = row.description || ''
  dialogVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除蜂箱 ${row.hiveNumber} 吗？`, '提示', {
      type: 'warning'
    })
    await deleteBeehive(row.id)
    ElMessage.success('删除成功')
    loadBeehives()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await updateBeehive(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await createBeehive(form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadBeehives()
  } catch (error) {
    console.error('提交失败', error)
  }
}

onMounted(() => {
  loadBeehives()
})
</script>
