<template>
  <div class="categories">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分类列表</span>
          <el-button type="primary" @click="handleAdd">新增分类</el-button>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="categoryName" label="分类名称" />
        <el-table-column prop="sortOrder" label="排序" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/categories')
    tableData.value = res.data
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  ElMessage.info('新增功能开发中')
}

const handleEdit = (row) => {
  ElMessage.info('编辑功能开发中')
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => {
    try {
      await request.delete(`/categories/${row.id}`)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>