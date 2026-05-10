<template>
  <div class="product-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加商品
          </el-button>
        </div>
      </template>
      
      <el-table :data="products" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="商品名称" width="150" />
        <el-table-column prop="pointsRequired" label="所需积分" width="120">
          <template #default="scope">
            <el-tag type="warning">{{ scope.row.pointsRequired }} 分</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.stock > 0 ? 'success' : 'danger'">
              {{ scope.row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-popconfirm title="确定删除该商品吗？" @confirm="handleDelete(scope.row.id)">
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑商品' : '添加商品'" width="400px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="所需积分" prop="pointsRequired">
          <el-input-number 
            v-model="form.pointsRequired" 
            :min="1"
            style="width: 100%" 
          />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number 
            v-model="form.stock" 
            :min="0"
            style="width: 100%" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { productApi } from '@/api'

const products = ref([])
const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = ref({
  id: null,
  name: '',
  pointsRequired: 1,
  stock: 0
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  pointsRequired: [{ required: true, message: '请输入所需积分', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

const getProducts = async () => {
  const res = await productApi.list()
  products.value = res.data
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { id: null, name: '', pointsRequired: 1, stock: 0 }
  showDialog.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  showDialog.value = true
}

const handleDelete = async (id) => {
  await productApi.delete(id)
  ElMessage.success('删除成功')
  getProducts()
}

const handleSubmit = async () => {
  await formRef.value.validate()
  if (isEdit.value) {
    await productApi.update(form.value)
    ElMessage.success('更新成功')
  } else {
    await productApi.create(form.value)
    ElMessage.success('添加成功')
  }
  showDialog.value = false
  getProducts()
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  getProducts()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
