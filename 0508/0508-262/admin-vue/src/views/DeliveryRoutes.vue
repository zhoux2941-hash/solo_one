<template>
  <div class="delivery-routes">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>配送路线列表</span>
          <el-button type="primary" @click="handleAdd">新增路线</el-button>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="routeName" label="路线名称" width="150" />
        <el-table-column prop="routeDescription" label="路线描述" />
        <el-table-column prop="deliveryPerson.nickname" label="配送员" width="120" />
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
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/delivery-routes')
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
  ElMessage.info('删除功能开发中')
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