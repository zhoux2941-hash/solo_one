<template>
  <div class="products">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="openImportDialog">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增商品
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品图片" width="120">
          <template #default="{ row }">
            <el-image
              :src="getImageUrl(row.images)"
              fit="cover"
              style="width: 80px; height: 80px; border-radius: 4px"
              @error="handleImageError"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon size="30"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="category.categoryName" label="分类" width="120" />
        <el-table-column label="原价" width="100">
          <template #default="{ row }">
            ¥{{ row.originalPrice }}
          </template>
        </el-table-column>
        <el-table-column label="团购价" width="100">
          <template #default="{ row }">
            ¥{{ row.groupPrice }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="sales" label="销量" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品' : '新增商品'" width="700px">
      <el-form :model="form" label-width="100px" ref="formRef">
        <el-form-item label="商品名称" prop="productName">
          <el-input v-model="form.productName" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.categoryName"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品图片" prop="images">
          <el-upload
            :action="uploadAction"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :show-file-list="true"
            :limit="5"
            list-type="picture-card"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 jpg/png/webp 文件，且不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="原价" prop="originalPrice">
          <el-input-number v-model="form.originalPrice" :min="0" :step="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="团购价" prop="groupPrice">
          <el-input-number v-model="form.groupPrice" :min="0" :step="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="如：斤、个、盒" />
        </el-form-item>
        <el-form-item label="规格" prop="specs">
          <el-input v-model="form.specs" placeholder="如：500g/份" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
        </el-form-item>
        <el-form-item label="推荐商品" prop="isRecommend">
          <el-switch v-model="form.isRecommend" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saveLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importDialogVisible" title="批量导入商品" width="600px">
      <el-alert
        title="导入说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <p>1. 请先上传商品图片，获取图片URL</p>
          <p>2. 按照格式填写商品信息</p>
          <p>3. 图片URL多个用逗号分隔</p>
        </template>
      </el-alert>

      <el-upload
        action="/api/files/batch-upload"
        :headers="uploadHeaders"
        :on-success="handleBatchUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        :show-file-list="true"
        :limit="20"
        multiple
        accept="image/*"
        style="margin-bottom: 20px"
      >
        <el-button type="primary">
          <el-icon><Upload /></el-icon>
          上传商品图片
        </el-button>
        <template #tip>
          <div class="el-upload__tip">
            支持批量上传图片，上传后会显示图片URL
          </div>
        </template>
      </el-upload>

      <div v-if="uploadedImages.length > 0" class="uploaded-images">
        <p style="margin-bottom: 10px; color: #666">已上传图片：</p>
        <div v-for="(img, index) in uploadedImages" :key="index" class="image-item">
          <el-image :src="getImageUrl(img.fileUrl)" fit="cover" style="width: 60px; height: 60px; border-radius: 4px" />
          <span class="image-url">{{ img.fileUrl }}</span>
        </div>
      </div>

      <div style="margin-top: 20px">
        <el-button type="success" @click="addImportRow">
          <el-icon><Plus /></el-icon>
          添加商品
        </el-button>
      </div>

      <div v-for="(item, index) in importList" :key="index" class="import-row">
        <el-divider>商品 {{ index + 1 }}</el-divider>
        <el-form :model="item" label-width="100px" size="small">
          <el-form-item label="商品名称">
            <el-input v-model="item.productName" placeholder="请输入商品名称" />
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="item.categoryId" placeholder="请选择分类" style="width: 100%">
              <el-option
                v-for="cat in categories"
                :key="cat.id"
                :label="cat.categoryName"
                :value="cat.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="图片URL">
            <el-input v-model="item.images" placeholder="请输入图片URL，多个用逗号分隔" />
          </el-form-item>
          <el-form-item label="原价">
            <el-input-number v-model="item.originalPrice" :min="0" :step="0.01" :precision="2" />
          </el-form-item>
          <el-form-item label="团购价">
            <el-input-number v-model="item.groupPrice" :min="0" :step="0.01" :precision="2" />
          </el-form-item>
          <el-form-item label="库存">
            <el-input-number v-model="item.stock" :min="0" />
          </el-form-item>
          <el-form-item label="单位">
            <el-input v-model="item.unit" placeholder="如：斤" />
          </el-form-item>
          <el-form-item label="推荐">
            <el-switch v-model="item.isRecommend" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item>
            <el-button size="small" type="danger" @click="removeImportRow(index)">删除</el-button>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchImport" :loading="importLoading">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElImage } from 'element-plus'
import { Plus, Upload, Picture } from '@element-plus/icons-vue'
import {
  getProductList,
  getCategoryList,
  createProduct,
  updateProduct,
  deleteProduct,
  batchImportProducts,
  getImageUrl as getImageUrlUtil
} from '@/api'
import { useUserStore } from '@/stores/user'

const loading = ref(false)
const saveLoading = ref(false)
const importLoading = ref(false)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const isEdit = ref(false)
const tableData = ref([])
const categories = ref([])
const uploadedImages = ref([])
const formRef = ref(null)

const form = ref({
  productName: '',
  categoryId: null,
  images: '',
  originalPrice: 0,
  groupPrice: 0,
  stock: 0,
  unit: '',
  specs: '',
  description: '',
  isRecommend: 0
})

const importList = ref([])

const userStore = useUserStore()
const uploadAction = '/api/files/upload'
const uploadHeaders = {
  Authorization: `Bearer ${userStore.token}`
}

const getImageUrl = (url) => {
  return getImageUrlUtil(url)
}

const handleImageError = () => {
  console.log('图片加载失败')
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getProductList()
    tableData.value = res.data
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await getCategoryList()
    categories.value = res.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response, file) => {
  if (response.code === 200) {
    form.value.images = response.data.fileUrl
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleBatchUploadSuccess = (response) => {
  if (response.code === 200) {
    uploadedImages.value = [...uploadedImages.value, ...response.data]
    ElMessage.success(`成功上传 ${response.data.length} 张图片`)
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('图片上传失败，请检查网络')
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    productName: '',
    categoryId: null,
    images: '',
    originalPrice: 0,
    groupPrice: 0,
    stock: 0,
    unit: '',
    specs: '',
    description: '',
    isRecommend: 0
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = {
    id: row.id,
    productName: row.productName,
    categoryId: row.category?.id,
    images: row.images,
    originalPrice: row.originalPrice,
    groupPrice: row.groupPrice,
    stock: row.stock,
    unit: row.unit,
    specs: row.specs,
    description: row.description,
    isRecommend: row.isRecommend,
    status: row.status
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const submitData = {
      ...form.value,
      category: form.value.categoryId ? { id: form.value.categoryId } : null
    }
    if (isEdit.value) {
      await updateProduct(form.value.id, submitData)
      ElMessage.success('更新成功')
    } else {
      submitData.status = 1
      await createProduct(submitData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteProduct(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }).catch(() => {})
}

const handleToggleStatus = async (row) => {
  ElMessage.info('状态切换功能请自行实现，调用更新接口')
}

const openImportDialog = () => {
  importDialogVisible.value = true
  uploadedImages.value = []
  importList.value = []
}

const addImportRow = () => {
  importList.value.push({
    productName: '',
    categoryId: null,
    images: '',
    originalPrice: 0,
    groupPrice: 0,
    stock: 0,
    unit: '',
    specs: '',
    description: '',
    isRecommend: 0,
    status: 1
  })
}

const removeImportRow = (index) => {
  importList.value.splice(index, 1)
}

const handleBatchImport = async () => {
  if (importList.value.length === 0) {
    ElMessage.warning('请至少添加一个商品')
    return
  }

  const invalidItems = importList.value.filter(item => !item.productName)
  if (invalidItems.length > 0) {
    ElMessage.warning('请填写所有商品的名称')
    return
  }

  importLoading.value = true
  try {
    const res = await batchImportProducts(importList.value)
    ElMessage.success(`批量导入完成：成功 ${res.data.successCount} 个，失败 ${res.data.failedCount} 个`)
    if (res.data.failedList && res.data.failedList.length > 0) {
      console.log('导入失败列表:', res.data.failedList)
    }
    importDialogVisible.value = false
    loadData()
  } finally {
    importLoading.value = false
  }
}

onMounted(() => {
  loadData()
  loadCategories()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.image-slot {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
  border-radius: 4px;
}

.uploaded-images {
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.image-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
}

.image-url {
  flex: 1;
  font-size: 12px;
  color: #666;
  word-break: break-all;
}

.import-row {
  background: #fafafa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

:deep(.el-divider__text) {
  background: #fafafa;
}
</style>