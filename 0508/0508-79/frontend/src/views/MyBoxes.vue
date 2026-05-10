<template>
  <div class="my-boxes-page">
    <div class="flex space-between items-center mb-20">
      <h2 class="page-title">我的盲盒</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加盲盒
      </el-button>
    </div>

    <el-empty v-if="!boxes.length" description="你还没有添加盲盒，快去添加吧" />
    <div v-else class="grid-4">
      <el-card v-for="box in boxes" :key="box.id" shadow="hover" class="box-card">
        <div class="box-image">
          <img v-if="box.imageUrl" :src="box.imageUrl" />
          <span v-else>{{ box.seriesName }}</span>
        </div>
        <div class="box-content">
          <p class="series">{{ box.seriesName }}</p>
          <p class="style">{{ box.styleName }}</p>
          <p class="model">型号: {{ box.modelNumber }}</p>
          <div class="flex space-between items-center mt-10">
            <el-tag :type="box.isAvailable ? 'success' : 'info'">
              {{ box.isAvailable ? '可交换' : '已交换' }}
            </el-tag>
            <el-tag type="info">{{ box.condition }}</el-tag>
          </div>
          <div class="flex space-between items-center mt-10">
            <el-button type="text" @click="editBox(box)">编辑</el-button>
            <el-button type="text" @click="delBox(box)" :disabled="!box.isAvailable">删除</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="showAddDialog" :title="editingBox ? '编辑盲盒' : '添加盲盒'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="型号" prop="modelNumber">
          <el-input v-model="form.modelNumber" placeholder="请输入型号" />
        </el-form-item>
        <el-form-item label="系列名称" prop="seriesName">
          <el-input v-model="form.seriesName" placeholder="请输入系列名称" />
        </el-form-item>
        <el-form-item label="款式" prop="styleName">
          <el-input v-model="form.styleName" placeholder="请输入款式" />
        </el-form-item>
        <el-form-item label="图片URL" prop="imageUrl">
          <el-input v-model="form.imageUrl" placeholder="请输入图片URL（可选）" />
        </el-form-item>
        <el-form-item label="新旧程度" prop="condition">
          <el-select v-model="form.condition" placeholder="请选择" style="width: 100%">
            <el-option label="全新" value="全新" />
            <el-option label="9成新" value="9成新" />
            <el-option label="8成新" value="8成新" />
            <el-option label="7成新" value="7成新" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">
          {{ editingBox ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMyBoxes, createBox, updateBox, deleteBox } from '@/api/box'

const boxes = ref([])
const showAddDialog = ref(false)
const editingBox = ref(null)
const formRef = ref()
const loading = ref(false)

const form = reactive({
  modelNumber: '',
  seriesName: '',
  styleName: '',
  imageUrl: '',
  condition: '',
  description: ''
})

const rules = {
  modelNumber: [{ required: true, message: '请输入型号', trigger: 'blur' }],
  seriesName: [{ required: true, message: '请输入系列名称', trigger: 'blur' }],
  styleName: [{ required: true, message: '请输入款式', trigger: 'blur' }],
  condition: [{ required: true, message: '请选择新旧程度', trigger: 'change' }]
}

const fetchBoxes = async () => {
  try {
    const res = await getMyBoxes()
    boxes.value = res.data
  } catch (e) {
  }
}

const resetForm = () => {
  editingBox.value = null
  form.modelNumber = ''
  form.seriesName = ''
  form.styleName = ''
  form.imageUrl = ''
  form.condition = ''
  form.description = ''
}

const editBox = (box) => {
  editingBox.value = box
  form.modelNumber = box.modelNumber
  form.seriesName = box.seriesName
  form.styleName = box.styleName
  form.imageUrl = box.imageUrl || ''
  form.condition = box.condition
  form.description = box.description || ''
  showAddDialog.value = true
}

const delBox = async (box) => {
  ElMessageBox.confirm(`确定要删除「${box.seriesName} - ${box.styleName}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteBox(box.id)
    ElMessage.success('删除成功')
    fetchBoxes()
  }).catch(() => {})
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    if (editingBox.value) {
      await updateBox(editingBox.value.id, form)
      ElMessage.success('更新成功')
    } else {
      await createBox(form)
      ElMessage.success('添加成功')
    }
    showAddDialog.value = false
    resetForm()
    fetchBoxes()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBoxes()
})
</script>

<style scoped>
.my-boxes-page {
  max-width: 1400px;
  margin: 0 auto;
}

.box-card {
  cursor: pointer;
}

.box-card :deep(.el-card__body) {
  padding: 0;
}

.box-content {
  padding: 12px;
}

.box-content .series {
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.box-content .style {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px 0;
}

.box-content .model {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.mt-10 {
  margin-top: 10px;
}
</style>
